import json
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.notification import Notification
from app.models.order import Order
from app.integrations.email_adapter import email_adapter
from app.integrations.whatsapp_adapter import whatsapp_adapter
from app.integrations.sms_adapter import sms_adapter

class NotificationService:
    async def log_and_send(
        self,
        db: AsyncSession,
        order: Optional[Order],
        channel: str,
        recipient: str,
        template_key: str,
        data: Dict[str, Any]
    ) -> Notification:
        """Sends a notification through the requested adapter and persists an audit log record."""
        notification = Notification(
            order_id=order.id if order else None,
            channel=channel,
            recipient=recipient,
            template_key=template_key,
            subject=f"Notification: {template_key}",
            content=json.dumps(data),
            status="PENDING",
            retry_count=0
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        success = False
        msg_id = ""
        error_msg = ""

        try:
            if channel == "EMAIL":
                success, msg_id, error_msg = await email_adapter.send(recipient, template_key, data)
            elif channel == "WHATSAPP":
                success, msg_id, error_msg = await whatsapp_adapter.send(recipient, template_key, data)
            elif channel == "SMS":
                success, msg_id, error_msg = await sms_adapter.send(recipient, template_key, data)
            
            notification.status = "SENT" if success else "FAILED"
            notification.provider_message_id = msg_id
            notification.error_message = error_msg
        except Exception as e:
            notification.status = "FAILED"
            notification.error_message = str(e)

        await db.commit()
        await db.refresh(notification)
        return notification

    async def notify_order_placed(self, db: AsyncSession, order: Order, customer_name: str, email: str, phone: Optional[str]):
        """Dispatches multi-channel customer and owner notifications on order placement."""
        try:
            addr = json.loads(order.address_snapshot)
        except Exception:
            addr = {}

        data = {
            "order_number": order.order_number,
            "customer_name": customer_name,
            "customer_phone": phone or addr.get("phone", ""),
            "total_inr": order.total_paise / 100.0,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "delivery_address": f"{addr.get('address_line1', '')}, {addr.get('city', '')}, {addr.get('state', '')} - {addr.get('pincode', '')}",
            "city": addr.get("city", ""),
            "pincode": addr.get("pincode", "")
        }

        template = "COD_ORDER_PLACED" if order.payment_method == "COD" else "ORDER_CONFIRMED"

        # 1. Customer Email
        if email:
            await self.log_and_send(db, order, "EMAIL", email, template, data)

        # 2. Customer WhatsApp
        if phone:
            await self.log_and_send(db, order, "WHATSAPP", phone, template, data)
            # 3. Customer SMS
            await self.log_and_send(db, order, "SMS", phone, template, data)

        # 4. Owner Alerts to Karthik
        if settings.OWNER_NOTIFICATION_EMAIL:
            await self.log_and_send(db, order, "EMAIL", settings.OWNER_NOTIFICATION_EMAIL, "OWNER_NEW_ORDER", data)
        if settings.OWNER_NOTIFICATION_PHONE:
            await self.log_and_send(db, order, "WHATSAPP", settings.OWNER_NOTIFICATION_PHONE, "OWNER_NEW_ORDER", data)
            await self.log_and_send(db, order, "SMS", settings.OWNER_NOTIFICATION_PHONE, "OWNER_NEW_ORDER", data)

    async def notify_payment_verified(self, db: AsyncSession, order: Order, payment_id: str, amount_inr: float):
        """Sends payment success notifications to customer and owner."""
        try:
            addr = json.loads(order.address_snapshot)
        except Exception:
            addr = {}

        email = order.guest_email or (order.user.email if order.user else "")
        phone = order.guest_phone or (order.user.phone if order.user else addr.get("phone", ""))
        name = order.guest_name or (order.user.name if order.user else "Customer")

        data = {
            "order_number": order.order_number,
            "customer_name": name,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "payment_method": order.payment_method,
            "payment_status": "PAID"
        }

        # Customer notifications
        if email:
            await self.log_and_send(db, order, "EMAIL", email, "PAYMENT_CONFIRMED", data)
        if phone:
            await self.log_and_send(db, order, "WHATSAPP", phone, "PAYMENT_CONFIRMED", data)

        # Owner alerts to Karthik
        if settings.OWNER_NOTIFICATION_EMAIL:
            await self.log_and_send(db, order, "EMAIL", settings.OWNER_NOTIFICATION_EMAIL, "OWNER_PAYMENT_VERIFIED", data)
        if settings.OWNER_NOTIFICATION_PHONE:
            await self.log_and_send(db, order, "WHATSAPP", settings.OWNER_NOTIFICATION_PHONE, "OWNER_PAYMENT_VERIFIED", data)

    async def notify_order_shipped(self, db: AsyncSession, order: Order, carrier: str, tracking_number: str, tracking_url: str):
        """Notifies customer of shipment dispatch."""
        try:
            addr = json.loads(order.address_snapshot)
        except Exception:
            addr = {}

        email = order.guest_email or (order.user.email if order.user else "")
        phone = order.guest_phone or (order.user.phone if order.user else addr.get("phone", ""))
        name = order.guest_name or (order.user.name if order.user else "Customer")

        data = {
            "order_number": order.order_number,
            "customer_name": name,
            "carrier": carrier,
            "tracking_number": tracking_number,
            "tracking_url": tracking_url
        }

        if email:
            await self.log_and_send(db, order, "EMAIL", email, "ORDER_SHIPPED", data)
        if phone:
            await self.log_and_send(db, order, "WHATSAPP", phone, "ORDER_SHIPPED", data)
            await self.log_and_send(db, order, "SMS", phone, "ORDER_SHIPPED", data)

    async def notify_low_stock(self, db: AsyncSession, product_name: str, sku: str, current_stock: int, threshold: int):
        """Sends low stock notification to owner."""
        data = {
            "product_name": product_name,
            "sku": sku,
            "current_stock": current_stock,
            "threshold": threshold
        }
        if settings.OWNER_NOTIFICATION_EMAIL:
            await self.log_and_send(db, None, "EMAIL", settings.OWNER_NOTIFICATION_EMAIL, "LOW_STOCK_ALERT", data)
        if settings.OWNER_NOTIFICATION_PHONE:
            await self.log_and_send(db, None, "WHATSAPP", settings.OWNER_NOTIFICATION_PHONE, "LOW_STOCK_ALERT", data)

notification_service = NotificationService()
