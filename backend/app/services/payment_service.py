import json
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.order import Order, Payment
from app.models.settings import AuditLog
from app.schemas.payment import PaymentVerifyRequest, PaymentVerifyResponse
from app.integrations.razorpay_client import razorpay_client
from app.services.notification_service import notification_service

class PaymentService:
    async def verify_payment(self, db: AsyncSession, data: PaymentVerifyRequest) -> PaymentVerifyResponse:
        # Find order
        order_res = await db.execute(select(Order).where(Order.id == data.order_id))
        order = order_res.scalars().first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Find payment record
        pay_res = await db.execute(
            select(Payment).where(
                Payment.order_id == data.order_id,
                Payment.gateway_order_id == data.gateway_order_id
            )
        )
        payment = pay_res.scalars().first()
        if not payment:
            # Check by order_id if order id matches
            pay_res2 = await db.execute(select(Payment).where(Payment.order_id == data.order_id))
            payment = pay_res2.scalars().first()
            if not payment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

        # Idempotency check: if already paid, return success immediately
        if payment.status == "PAID":
            return PaymentVerifyResponse(
                success=True,
                message="Payment already verified",
                payment_status=order.payment_status,
                order_status=order.status
            )

        # Cryptographic signature verification
        is_valid = razorpay_client.verify_payment_signature(
            razorpay_order_id=data.gateway_order_id,
            razorpay_payment_id=data.gateway_payment_id,
            razorpay_signature=data.gateway_signature or ""
        )

        if not is_valid:
            payment.status = "FAILED"
            order.payment_status = "FAILED"
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cryptographic payment signature verification failed"
            )

        # Update payment and order
        payment.status = "PAID"
        payment.gateway_payment_id = data.gateway_payment_id
        payment.gateway_signature = data.gateway_signature
        
        order.payment_status = "PAID"
        if order.status == "PENDING":
            order.status = "CONFIRMED"

        db.add(AuditLog(
            action="PAYMENT_VERIFIED",
            entity_type="Order",
            entity_id=order.id,
            metadata_json=json.dumps({
                "gateway_order_id": data.gateway_order_id,
                "gateway_payment_id": data.gateway_payment_id,
                "amount": payment.amount_paise
            })
        ))

        await db.commit()
        await db.refresh(order)

        # Trigger customer & owner notifications
        await notification_service.notify_order_placed(
            db=db,
            order=order,
            customer_name=order.guest_name or "Customer",
            email=order.guest_email or "",
            phone=order.guest_phone or ""
        )

        return PaymentVerifyResponse(
            success=True,
            message="Payment successfully verified",
            payment_status=order.payment_status,
            order_status=order.status
        )

    async def handle_webhook(self, db: AsyncSession, raw_body: bytes, signature: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Processes signed Razorpay webhooks idempotently with replay attack prevention."""
        is_valid = razorpay_client.verify_webhook_signature(raw_body, signature)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

        event = event_data.get("event")
        payload = event_data.get("payload", {})
        
        if event in ["payment.captured", "order.paid"]:
            entity = payload.get("payment", {}).get("entity", {}) or payload.get("order", {}).get("entity", {})
            razorpay_order_id = entity.get("order_id") or entity.get("id")
            razorpay_payment_id = entity.get("id")

            if razorpay_order_id:
                pay_res = await db.execute(select(Payment).where(Payment.gateway_order_id == razorpay_order_id))
                payment = pay_res.scalars().first()
                if payment and payment.status != "PAID":
                    payment.status = "PAID"
                    payment.gateway_payment_id = razorpay_payment_id
                    
                    order_res = await db.execute(select(Order).where(Order.id == payment.order_id))
                    order = order_res.scalars().first()
                    if order:
                        order.payment_status = "PAID"
                        if order.status == "PENDING":
                            order.status = "CONFIRMED"
                    
                    await db.commit()

        return {"status": "ok"}

payment_service = PaymentService()
