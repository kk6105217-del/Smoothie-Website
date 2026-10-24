from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.order import QuoteRequest, QuoteResponse
from app.schemas.coupon import CouponApplyRequest, CouponApplyResponse
from app.services.pricing_service import pricing_service

router = APIRouter(prefix="/checkout", tags=["Checkout & Pricing"])

@router.post("/quote", response_model=QuoteResponse)
async def calculate_checkout_quote(
    data: QuoteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authoritative server quote endpoint.
    Verifies product availability, prices, shipping rules, tax rate, and coupons.
    """
    quote = await pricing_service.calculate_quote(
        db=db,
        items=data.items,
        pincode=data.pincode,
        coupon_code=data.coupon_code
    )
    return QuoteResponse(
        subtotal_paise=quote["subtotal_paise"],
        discount_paise=quote["discount_paise"],
        shipping_paise=quote["shipping_paise"],
        tax_paise=quote["tax_paise"],
        total_paise=quote["total_paise"],
        coupon_code=quote["coupon_code"],
        coupon_message=quote["coupon_message"],
        is_cod_eligible=quote["is_cod_eligible"],
        estimated_delivery_days=quote["estimated_delivery_days"]
    )

@router.post("/coupons/apply", response_model=CouponApplyResponse)
async def validate_coupon(
    data: CouponApplyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verifies a promotional coupon code."""
    quote = await pricing_service.calculate_quote(
        db=db,
        items=[], # We pass empty items or evaluate directly
        coupon_code=data.code
    ) if False else None # Let's evaluate directly using DB query

    from app.models.coupon import Coupon
    from sqlalchemy.future import select
    from datetime import datetime, timezone

    res = await db.execute(select(Coupon).where(Coupon.code == data.code.strip().upper()))
    coupon = res.scalars().first()
    now = datetime.now(timezone.utc)

    if not coupon or not coupon.is_active:
        return CouponApplyResponse(is_valid=False, code=data.code, discount_paise=0, message="Invalid or inactive coupon code")
    if coupon.valid_until and coupon.valid_until < now:
        return CouponApplyResponse(is_valid=False, code=data.code, discount_paise=0, message="Coupon has expired")
    if coupon.times_used >= coupon.usage_limit:
        return CouponApplyResponse(is_valid=False, code=data.code, discount_paise=0, message="Coupon usage limit exceeded")
    if data.cart_subtotal_paise < coupon.minimum_order:
        min_inr = coupon.minimum_order / 100
        return CouponApplyResponse(is_valid=False, code=data.code, discount_paise=0, message=f"Minimum order value of ₹{min_inr:.0f} required")

    discount = int((data.cart_subtotal_paise * coupon.discount_value) / 100) if coupon.discount_type == "PERCENT" else coupon.discount_value
    discount = min(discount, data.cart_subtotal_paise)

    return CouponApplyResponse(
        is_valid=True,
        code=coupon.code,
        discount_paise=discount,
        message=f"Coupon '{coupon.code}' applied successfully!"
    )
