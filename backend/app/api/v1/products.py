import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.review import Review
from app.schemas.product import ProductOut, ProductListOut, ReviewCreate, ReviewOut
from app.services.product_service import product_service

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductListOut)
async def list_products(
    search: Optional[str] = Query(None, description="Search term for name, SKU, or specs"),
    category: Optional[str] = Query(None, description="Category slug"),
    category_id: Optional[str] = Query(None, description="Category ID"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price in paise"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price in paise"),
    in_stock: bool = Query(False, description="Filter only items with stock > 0"),
    featured: bool = Query(False, description="Filter only featured items"),
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|popularity)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Public API: Search, filter, sort and paginate published products."""
    items, total = await product_service.list_products(
        db=db,
        search=search,
        category_slug=category,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock,
        featured_only=featured,
        only_published=True,
        include_archived=False,
        sort_by=sort,
        page=page,
        page_size=page_size
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ProductListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{slug}", response_model=ProductOut)
async def get_product_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Public API: Fetch complete product details by slug."""
    product = await product_service.get_product_by_slug(db, slug)
    if not product:
        # Fallback to ID lookup
        product = await product_service.get_product_by_id(db, slug)
        if not product or product.is_archived or not product.is_published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.post("/{product_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def add_review(
    product_id: str,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Authenticated customer review submission."""
    product = await product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    review = Review(
        product_id=product.id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        comment=data.comment.strip(),
        moderation_status="APPROVED"
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    review.user_name = current_user.name
    return review
