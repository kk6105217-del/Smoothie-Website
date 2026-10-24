from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.config import settings
from app.models.order import Order, Payment
from app.schemas.payment import (
    PaymentCreateRequest, PaymentCreateResponse, PaymentVerifyRequest, PaymentVerifyResponse
)
from app.services.payment_service import payment_service
from app.integrations.razorpay_client import razorpay_client

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create", response_model=PaymentCreateResponse)
async def create_payment_order(
    data: PaymentCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates payment gateway order for an existing pending order.
    Returns Razorpay key ID, order ID, and authoritative amount.
    """
    order_res = await db.execute(select(Order).where(Order.id == data.order_id))
    order = order_res.scalars().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.payment_status == "PAID":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has already been paid")

    rz_order = await razorpay_client.create_order(
        amount_paise=order.total_paise,
        receipt=order.order_number,
        notes={"order_id": order.id, "order_number": order.order_number}
    )

    # Save payment row
    payment = Payment(
        order_id=order.id,
        gateway="RAZORPAY",
        gateway_order_id=rz_order.get("id"),
        amount_paise=order.total_paise,
        currency="INR",
        status="PENDING"
    )
    db.add(payment)
    await db.commit()

    return PaymentCreateResponse(
        order_id=order.id,
        order_number=order.order_number,
        gateway="RAZORPAY",
        gateway_order_id=rz_order.get("id"),
        razorpay_key_id=settings.RAZORPAY_KEY_ID or "rzp_test_mock_key",
        amount_paise=order.total_paise,
        currency="INR"
    )

@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(
    data: PaymentVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Cryptographically verifies the payment on the server.
    Ensures that client payment messages alone are never trusted.
    """
    return await payment_service.verify_payment(db, data)
