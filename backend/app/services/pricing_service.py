from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.core.config import settings
from app.models.product import Product
from app.models.coupon import Coupon
from app.schemas.order import ItemQuantity

class PricingService:
    async def calculate_quote(
        self,
        db: AsyncSession,
        items: List[ItemQuantity],
        pincode: Optional[str] = None,
        coupon_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative backend pricing calculation:
        Subtotal = Sum(verified unit price * quantity)
        Total = Subtotal - discount + shipping + tax
        Never trust client amounts!
        """
        if not items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        subtotal_paise = 0
        verified_items = []

        for item_in in items:
            result = await db.execute(
                select(Product)
                .options(selectinload(Product.images))
                .where(Product.id == item_in.product_id)
            )
            product = result.scalars().first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item_in.product_id} not found")
            if not product.is_published or product.is_archived:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product '{product.name}' is unavailable")
            if product.stock_quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}"
                )

            unit_price = product.sale_price if product.sale_price and product.sale_price < product.price else product.price
            line_total = unit_price * item_in.quantity
            subtotal_paise += line_total

            verified_items.append({
                "product": product,
                "quantity": item_in.quantity,
                "unit_price_paise": unit_price,
                "line_total_paise": line_total
            })

        # Calculate Coupon Discount
        discount_paise = 0
        coupon_message = None
        applied_coupon = None

        if coupon_code:
            coupon_res = await db.execute(select(Coupon).where(Coupon.code == coupon_code.strip().upper()))
            coupon = coupon_res.scalars().first()
            now = datetime.now(timezone.utc)
            
            if not coupon or not coupon.is_active:
                coupon_message = "Invalid or inactive coupon code"
            elif coupon.valid_until and coupon.valid_until < now:
                coupon_message = "Coupon has expired"
            elif coupon.times_used >= coupon.usage_limit:
                coupon_message = "Coupon usage limit reached"
            elif subtotal_paise < coupon.minimum_order:
                min_inr = coupon.minimum_order / 100
                coupon_message = f"Minimum order of ₹{min_inr:.0f} required for coupon"
            else:
                applied_coupon = coupon
                if coupon.discount_type == "PERCENT":
                    discount_paise = int((subtotal_paise * coupon.discount_value) / 100)
                else:  # FIXED
                    discount_paise = coupon.discount_value
                
                # Cannot exceed subtotal
                discount_paise = min(discount_paise, subtotal_paise)
                coupon_message = f"Coupon '{coupon.code}' applied successfully"

        # Calculate Shipping (Free if subtotal meets threshold)
        shipping_paise = 0 if subtotal_paise >= settings.FREE_SHIPPING_THRESHOLD_PAISE else settings.DEFAULT_SHIPPING_PAISE

        # Calculate Tax (GST 18% included or added - standard India e-commerce displays item inclusive GST,
        # but spec requests itemized tax breakdown: tax_paise = (subtotal - discount) * (tax_rate / 100))
        # Here we compute the tax amount for disclosure and invoices
        taxable_amount = max(0, subtotal_paise - discount_paise)
        tax_paise = int(taxable_amount * (settings.TAX_RATE_PERCENT / 100.0))

        # Authoritative Total
        total_paise = taxable_amount + shipping_paise + tax_paise

        # COD eligibility
        is_cod_eligible = (
            settings.COD_ENABLED and
            total_paise <= settings.COD_MAX_LIMIT_PAISE and
            (not pincode or len(pincode) == 6)
        )

        return {
            "subtotal_paise": subtotal_paise,
            "discount_paise": discount_paise,
            "shipping_paise": shipping_paise,
            "tax_paise": tax_paise,
            "total_paise": total_paise,
            "coupon_code": applied_coupon.code if applied_coupon else None,
            "coupon_message": coupon_message,
            "is_cod_eligible": is_cod_eligible,
            "estimated_delivery_days": 4 if not pincode or pincode.startswith(("1", "2", "3", "4", "5", "6")) else 6,
            "verified_items": verified_items
        }

pricing_service = PricingService()
