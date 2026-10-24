import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem, Payment, Shipment, Refund
from app.models.product import Product
from app.models.coupon import Coupon
from app.models.user import User
from app.models.settings import AuditLog
from app.schemas.order import OrderCreateRequest, ShippingAddressInput, ShipmentCreate
from app.services.pricing_service import pricing_service
from app.services.notification_service import notification_service
from app.services.cart_service import cart_service
from app.integrations.razorpay_client import razorpay_client

def generate_order_number() -> str:
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = uuid.uuid4().hex[:6].upper()
    return f"DIY-{now_str}-{random_suffix}"

class OrderService:
    async def create_order(
        self,
        db: AsyncSession,
        data: OrderCreateRequest,
        current_user: Optional[User] = None
    ) -> Tuple[Order, Optional[Dict[str, Any]]]:
        """
        Creates an order with transactional inventory reservation and snapshot capture.
        Never trust client prices or totals.
        """
        # Validate pricing and stock
        quote = await pricing_service.calculate_quote(
            db=db,
            items=data.items,
            pincode=data.shipping_address.pincode,
            coupon_code=data.coupon_code
        )

        if data.payment_method == "COD" and not quote["is_cod_eligible"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash on Delivery is not eligible for this order total or location"
            )

        # Generate unique order number
        order_number = generate_order_number()

        # Customer details
        user_id = current_user.id if current_user else None
        guest_name = data.guest_name or (current_user.name if current_user else data.shipping_address.recipient_name)
        guest_email = str(data.guest_email) if data.guest_email else (current_user.email if current_user else None)
        guest_phone = data.guest_phone or (current_user.phone if current_user else data.shipping_address.phone)

        # Serialized address snapshot
        address_dict = data.shipping_address.model_dump()
        address_snapshot = json.dumps(address_dict)

        # Create Order
        order = Order(
            order_number=order_number,
            user_id=user_id,
            guest_name=guest_name,
            guest_email=guest_email,
            guest_phone=guest_phone,
            status="PENDING",
            payment_method=data.payment_method,
            payment_status="PENDING",
            cod_collected=False,
            address_snapshot=address_snapshot,
            subtotal_paise=quote["subtotal_paise"],
            discount_paise=quote["discount_paise"],
            shipping_paise=quote["shipping_paise"],
            tax_paise=quote["tax_paise"],
            total_paise=quote["total_paise"],
            coupon_code=quote["coupon_code"],
            notes=data.notes
        )
        db.add(order)
        await db.flush()

        # Deduct stock and create immutable Order Items
        for item_info in quote["verified_items"]:
            prod: Product = item_info["product"]
            qty: int = item_info["quantity"]

            # Deduct stock
            prod.stock_quantity = max(0, prod.stock_quantity - qty)
            
            # Check low stock threshold alert
            if prod.stock_quantity <= prod.low_stock_threshold:
                # Trigger low stock warning
                await notification_service.notify_low_stock(
                    db, prod.name, prod.sku, prod.stock_quantity, prod.low_stock_threshold
                )

            # Get image for snapshot
            image_url = prod.images[0].image_url if prod.images else None

            order_item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                sku_snapshot=prod.sku,
                name_snapshot=prod.name,
                unit_price_paise=item_info["unit_price_paise"],
                quantity=qty,
                tax_amount_paise=int(item_info["line_total_paise"] * 0.18),
                line_total_paise=item_info["line_total_paise"],
                image_url_snapshot=image_url
            )
            db.add(order_item)

        # Update coupon times_used if applied
        if quote["coupon_code"]:
            coupon_res = await db.execute(select(Coupon).where(Coupon.code == quote["coupon_code"]))
            c = coupon_res.scalars().first()
            if c:
                c.times_used += 1

        # Clear cart if session_token provided or user logged in
        if current_user:
            user_cart = await cart_service.get_or_create_cart(db, user_id=current_user.id)
            await cart_service.clear_cart(db, user_cart.id)
        elif data.session_token:
            guest_cart = await cart_service.get_or_create_cart(db, session_token=data.session_token)
            await cart_service.clear_cart(db, guest_cart.id)

        await db.commit()

        # Handle Gateway initialization or COD notification
        razorpay_order_data = None
        if data.payment_method == "ONLINE":
            # Create Razorpay order
            rz_order = await razorpay_client.create_order(
                amount_paise=order.total_paise,
                receipt=order.order_number,
                notes={"order_id": order.id, "order_number": order.order_number}
            )
            payment = Payment(
                order_id=order.id,
                gateway="RAZORPAY",
                gateway_order_id=rz_order.get("id"),
                amount_paise=order.total_paise,
                currency="INR",
                status="PENDING",
                raw_response=json.dumps(rz_order)
            )
            db.add(payment)
            await db.commit()
            razorpay_order_data = rz_order
        else:
            # COD: Order is placed, trigger notifications immediately
            await notification_service.notify_order_placed(
                db=db,
                order=order,
                customer_name=guest_name,
                email=guest_email,
                phone=guest_phone
            )

        full_order = await self.get_order_by_id(db, order.id)
        return full_order, razorpay_order_data

    async def get_order_by_id(self, db: AsyncSession, order_id: str) -> Optional[Order]:
        res = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payments),
                selectinload(Order.shipments),
                selectinload(Order.user)
            )
            .where(Order.id == order_id)
        )
        return res.scalars().first()

    async def get_order_by_number(self, db: AsyncSession, order_number: str) -> Optional[Order]:
        res = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payments),
                selectinload(Order.shipments),
                selectinload(Order.user)
            )
            .where(Order.order_number == order_number)
        )
        return res.scalars().first()

    async def list_orders(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        payment_status_filter: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Order], int]:
        query = select(Order).options(
            selectinload(Order.items),
            selectinload(Order.payments),
            selectinload(Order.shipments),
            selectinload(Order.user)
        )

        if user_id:
            query = query.where(Order.user_id == user_id)
        if status_filter:
            query = query.where(Order.status == status_filter)
        if payment_status_filter:
            query = query.where(Order.payment_status == payment_status_filter)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Order.order_number.ilike(search_term),
                    Order.guest_name.ilike(search_term),
                    Order.guest_email.ilike(search_term),
                    Order.guest_phone.ilike(search_term)
                )
            )

        count_query = select(func.count()).select_from(query.order_by(None).subquery())
        total = (await db.execute(count_query)).scalar_one()

        query = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        return list(result.scalars().all()), total

    async def update_status(
        self,
        db: AsyncSession,
        order_id: str,
        new_status: str,
        notes: Optional[str] = None,
        cod_collected: Optional[bool] = None,
        actor_id: Optional[str] = None
    ) -> Order:
        order = await self.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        valid_statuses = [
            "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED",
            "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED"
        ]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {new_status}")

        old_status = order.status
        order.status = new_status
        if notes:
            order.notes = f"{order.notes or ''}\n[{new_status}] {notes}".strip()
        if cod_collected is not None:
            order.cod_collected = cod_collected
            if cod_collected and order.payment_method == "COD":
                order.payment_status = "PAID"

        # Log audit
        db.add(AuditLog(
            actor_user_id=actor_id,
            action="ORDER_STATUS_UPDATE",
            entity_type="Order",
            entity_id=order.id,
            metadata_json=json.dumps({"from": old_status, "to": new_status, "cod_collected": cod_collected})
        ))

        await db.commit()
        await db.refresh(order)
        return order

    async def cancel_order(
        self,
        db: AsyncSession,
        order_id: str,
        reason: str,
        current_user: Optional[User] = None
    ) -> Order:
        order = await self.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Authorization: owner can cancel anything, customer only their own order
        if current_user and current_user.role != "OWNER" and order.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

        if order.status in ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel order in status '{order.status}'")

        order.status = "CANCELLED"
        order.cancellation_reason = reason

        # Restock inventory
        for item in order.items:
            if item.product_id:
                prod_res = await db.execute(select(Product).where(Product.id == item.product_id))
                prod = prod_res.scalars().first()
                if prod:
                    prod.stock_quantity += item.quantity

        await db.commit()
        await db.refresh(order)
        return order

    async def add_shipment(
        self,
        db: AsyncSession,
        order_id: str,
        data: ShipmentCreate,
        actor_id: Optional[str] = None
    ) -> Order:
        order = await self.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        shipment = Shipment(
            order_id=order.id,
            carrier=data.carrier,
            tracking_number=data.tracking_number,
            tracking_url=data.tracking_url,
            status=data.status
        )
        db.add(shipment)
        order.status = "SHIPPED"

        db.add(AuditLog(
            actor_user_id=actor_id,
            action="ORDER_SHIPPED",
            entity_type="Order",
            entity_id=order.id,
            metadata_json=json.dumps({"carrier": data.carrier, "tracking_number": data.tracking_number})
        ))

        await db.commit()
        await db.refresh(order)

        # Notify customer
        await notification_service.notify_order_shipped(
            db=db,
            order=order,
            carrier=data.carrier,
            tracking_number=data.tracking_number,
            tracking_url=data.tracking_url or ""
        )

        return await self.get_order_by_id(db, order_id)

order_service = OrderService()
