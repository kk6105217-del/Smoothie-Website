from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_optional_current_user, get_current_user
from app.models.user import User
from app.models.cart import Cart
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartOut, CartItemOut, WishlistItemOut, WishlistToggleRequest
from app.services.cart_service import cart_service

router = APIRouter(prefix="/cart", tags=["Shopping Cart & Wishlist"])

def format_cart_response(cart: Cart) -> CartOut:
    items_out = []
    subtotal = 0
    total_qty = 0

    if cart and cart.items:
        for it in cart.items:
            prod = it.product
            if prod and not prod.is_archived and prod.is_published:
                unit_price = prod.sale_price if prod.sale_price and prod.sale_price < prod.price else prod.price
                line_total = unit_price * it.quantity
                subtotal += line_total
                total_qty += it.quantity
                items_out.append(CartItemOut(
                    id=it.id,
                    product_id=it.product_id,
                    quantity=it.quantity,
                    product=prod,
                    line_total_paise=line_total
                ))

    return CartOut(
        id=cart.id if cart else "",
        session_token=None,
        items=items_out,
        subtotal_paise=subtotal,
        total_items=total_qty
    )

@router.get("", response_model=CartOut)
async def get_cart(
    session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    cart = await cart_service.get_or_create_cart(db, user_id=user_id, session_token=session_token)
    return format_cart_response(cart)

@router.post("/items", response_model=CartOut)
async def add_item_to_cart(
    data: CartItemCreate,
    session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    effective_token = session_token or data.session_token
    cart = await cart_service.get_or_create_cart(db, user_id=user_id, session_token=effective_token)
    cart = await cart_service.add_item(db, cart, product_id=data.product_id, quantity=data.quantity)
    return format_cart_response(cart)

@router.patch("/items/{item_id}", response_model=CartOut)
async def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    cart = await cart_service.get_or_create_cart(db, user_id=user_id, session_token=session_token)
    cart = await cart_service.update_quantity(db, cart, item_id=item_id, quantity=data.quantity)
    return format_cart_response(cart)

@router.delete("/items/{item_id}", response_model=CartOut)
async def delete_cart_item(
    item_id: str,
    session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    cart = await cart_service.get_or_create_cart(db, user_id=user_id, session_token=session_token)
    cart = await cart_service.remove_item(db, cart, item_id=item_id)
    return format_cart_response(cart)

# Wishlist endpoints
@router.get("/wishlist", response_model=List[WishlistItemOut])
async def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await cart_service.get_wishlist(db, user_id=current_user.id)

@router.post("/wishlist/toggle")
async def toggle_wishlist_item(
    data: WishlistToggleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    saved = await cart_service.toggle_wishlist(db, user_id=current_user.id, product_id=data.product_id)
    return {"saved": saved, "message": "Added to wishlist" if saved else "Removed from wishlist"}
