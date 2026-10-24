import hashlib
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.cart import Cart, CartItem, Wishlist
from app.models.product import Product

class CartService:
    async def get_or_create_cart(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        session_token: Optional[str] = None
    ) -> Cart:
        token_hash = hashlib.sha256(session_token.encode()).hexdigest() if session_token else None

        # Look up by user_id first if logged in
        if user_id:
            res = await db.execute(
                select(Cart)
                .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
                .where(Cart.user_id == user_id)
            )
            cart = res.scalars().first()
            if cart:
                return cart

        # Next check guest cart by token hash
        if token_hash:
            res = await db.execute(
                select(Cart)
                .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
                .where(Cart.session_token_hash == token_hash)
            )
            cart = res.scalars().first()
            if cart:
                # If user now logged in, claim guest cart
                if user_id and not cart.user_id:
                    cart.user_id = user_id
                    await db.commit()
                return cart

        # Create new cart
        new_cart = Cart(
            user_id=user_id,
            session_token_hash=token_hash
        )
        db.add(new_cart)
        await db.commit()
        await db.refresh(new_cart)
        return await self.get_cart_by_id(db, new_cart.id)

    async def get_cart_by_id(self, db: AsyncSession, cart_id: str) -> Optional[Cart]:
        res = await db.execute(
            select(Cart)
            .options(
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category)
            )
            .where(Cart.id == cart_id)
        )
        return res.scalars().first()

    async def add_item(self, db: AsyncSession, cart: Cart, product_id: str, quantity: int = 1) -> Cart:
        # Check product stock
        prod_res = await db.execute(select(Product).where(Product.id == product_id))
        product = prod_res.scalars().first()
        if not product or product.is_archived or not product.is_published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product is unavailable")
        
        # Check existing item in cart
        res = await db.execute(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id))
        item = res.scalars().first()
        
        target_qty = (item.quantity + quantity) if item else quantity
        if product.stock_quantity < target_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock_quantity} units available in stock"
            )

        if item:
            item.quantity = target_qty
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity
            )
            db.add(item)

        await db.commit()
        return await self.get_cart_by_id(db, cart.id)

    async def update_quantity(self, db: AsyncSession, cart: Cart, item_id: str, quantity: int) -> Cart:
        res = await db.execute(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
        item = res.scalars().first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

        prod_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = prod_res.scalars().first()
        if product and product.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock_quantity} units available"
            )

        if quantity <= 0:
            await db.delete(item)
        else:
            item.quantity = quantity
        
        await db.commit()
        return await self.get_cart_by_id(db, cart.id)

    async def remove_item(self, db: AsyncSession, cart: Cart, item_id: str) -> Cart:
        res = await db.execute(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
        item = res.scalars().first()
        if item:
            await db.delete(item)
            await db.commit()
        return await self.get_cart_by_id(db, cart.id)

    async def clear_cart(self, db: AsyncSession, cart_id: str):
        cart = await self.get_cart_by_id(db, cart_id)
        if cart:
            for it in cart.items:
                await db.delete(it)
            await db.commit()

    async def toggle_wishlist(self, db: AsyncSession, user_id: str, product_id: str) -> bool:
        """Toggles a product in customer's wishlist; returns True if now saved, False if removed."""
        res = await db.execute(select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.product_id == product_id))
        existing = res.scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()
            return False
        else:
            db.add(Wishlist(user_id=user_id, product_id=product_id))
            await db.commit()
            return True

    async def get_wishlist(self, db: AsyncSession, user_id: str) -> List[Wishlist]:
        res = await db.execute(
            select(Wishlist)
            .options(
                selectinload(Wishlist.product).selectinload(Product.images),
                selectinload(Wishlist.product).selectinload(Product.category)
            )
            .where(Wishlist.user_id == user_id)
            .order_by(Wishlist.created_at.desc())
        )
        return list(res.scalars().all())

cart_service = CartService()
