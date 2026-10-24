import json
import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_optional_current_user, get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.order import (
    OrderCreateRequest, OrderOut, OrderListOut, OrderCancelRequest, OrderReturnRequest, ShipmentOut
)
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])

def serialize_order(order: Order) -> OrderOut:
    try:
        addr = json.loads(order.address_snapshot) if order.address_snapshot else {}
    except Exception:
        addr = {}

    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        guest_name=order.guest_name,
        guest_email=order.guest_email,
        guest_phone=order.guest_phone,
        status=order.status,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        cod_collected=order.cod_collected,
        address_snapshot=addr,
        subtotal_paise=order.subtotal_paise,
        discount_paise=order.discount_paise,
        shipping_paise=order.shipping_paise,
        tax_paise=order.tax_paise,
        total_paise=order.total_paise,
        coupon_code=order.coupon_code,
        cancellation_reason=order.cancellation_reason,
        return_reason=order.return_reason,
        notes=order.notes,
        created_at=order.created_at,
        items=order.items,
        payments=order.payments,
        shipments=order.shipments
    )

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates cart, stock, and delivery address.
    Creates pending order and reserves stock transactionally.
    Returns order details and gateway payment order info if ONLINE.
    """
    order, razorpay_order = await order_service.create_order(
        db=db,
        data=data,
        current_user=current_user
    )
    
    return {
        "order": serialize_order(order),
        "gateway_data": razorpay_order
    }

@router.get("", response_model=OrderListOut)
async def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """View customer's own order history."""
    orders, total = await order_service.list_orders(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return OrderListOut(
        items=[serialize_order(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{order_identifier}", response_model=OrderOut)
async def get_order_details(
    order_identifier: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch authorized order details by order_number or order ID.
    If authenticated customer, verifies ownership.
    If guest order, allows lookup by order number.
    """
    order = await order_service.get_order_by_number(db, order_identifier)
    if not order:
        order = await order_service.get_order_by_id(db, order_identifier)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # If order is bound to a registered user, ensure the requesting user is the owner or admin
    if order.user_id:
        if not current_user or (current_user.id != order.user_id and current_user.role != "OWNER"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this order")

    return serialize_order(order)

@router.post("/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: str,
    data: OrderCancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Customer or owner cancels an eligible order."""
    order = await order_service.cancel_order(
        db=db,
        order_id=order_id,
        reason=data.reason,
        current_user=current_user
    )
    return serialize_order(order)

@router.post("/{order_id}/return-requests", response_model=OrderOut)
async def request_order_return(
    order_id: str,
    data: OrderReturnRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Customer requests return on a delivered order."""
    order = await order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != "OWNER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if order.status != "DELIVERED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only delivered orders can be returned")

    order.status = "RETURN_REQUESTED"
    order.return_reason = data.reason
    await db.commit()
    await db.refresh(order)
    return serialize_order(order)

@router.get("/{order_id}/tracking", response_model=List[ShipmentOut])
async def get_order_tracking(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetch shipment status and tracking details for an order."""
    order = await order_service.get_order_by_id(db, order_id)
    if not order:
        order = await order_service.get_order_by_number(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return order.shipments
