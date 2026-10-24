import os
import uuid
import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from app.core.database import get_db
from app.core.dependencies import require_owner
from app.core.config import settings
from app.models.user import User
from app.models.coupon import Coupon
from app.models.notification import Notification
from app.models.settings import AuditLog, StoreSetting
from app.models.product import Category, ProductImage
from app.schemas.admin import (
    DashboardStatsOut, SalesReportOut, AuditLogOut, NotificationLogOut, CustomerSummaryOut
)
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut, ProductListOut, ProductPublishRequest,
    CategoryCreate, CategoryUpdate, CategoryOut
)
from app.schemas.order import OrderOut, OrderListOut, OrderStatusUpdate, ShipmentCreate
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponOut
from app.services.admin_service import admin_service
from app.services.product_service import product_service
from app.services.order_service import order_service
from app.api.v1.orders import serialize_order

router = APIRouter(prefix="/admin", tags=["Owner Administration"], dependencies=[Depends(require_owner)])

# 1. Dashboard
@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard(
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    """Owner dashboard statistics: orders, strictly paid revenue, stock alerts, best sellers."""
    stats = await admin_service.get_dashboard_stats(db)
    return DashboardStatsOut(**stats)

# 2. Products Management
@router.get("/products", response_model=ProductListOut)
async def admin_list_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    sort: str = "newest",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    items, total = await product_service.list_products(
        db=db,
        search=search,
        category_id=category_id,
        only_published=False,
        include_archived=True,
        sort_by=sort,
        page=page,
        page_size=page_size
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return ProductListOut(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await product_service.create_product(db, data, actor_id=current_owner.id)

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await product_service.update_product(db, product_id, data, actor_id=current_owner.id)

@router.delete("/products/{product_id}", response_model=ProductOut)
async def archive_product(
    product_id: str,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await product_service.archive_product(db, product_id, actor_id=current_owner.id)

@router.patch("/products/{product_id}/publish", response_model=ProductOut)
async def toggle_product_publish(
    product_id: str,
    data: Optional[ProductPublishRequest] = None,
    is_published: Optional[bool] = None,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    """Publish or unpublish a product."""
    target_state = True
    if data is not None:
        target_state = data.is_published
    elif is_published is not None:
        target_state = is_published

    return await product_service.update_product(
        db, product_id, ProductUpdate(is_published=target_state), actor_id=current_owner.id
    )

@router.post("/products/{product_id}/images", response_model=ProductOut)
async def upload_product_images(
    product_id: str,
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    """Upload product images and attach directly to the product."""
    product = await product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    upload_list = []
    if files:
        upload_list.extend(files)
    if file:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No image file provided")

    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    current_count = len(product.images)
    for idx, uploaded_file in enumerate(upload_list):
        if uploaded_file.content_type not in allowed_types:
            continue
        ext = os.path.splitext(uploaded_file.filename or "")[1] or ".jpg"
        safe_name = f"prod_{product_id[:8]}_{uuid.uuid4().hex[:8]}{ext}"
        dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        contents = await uploaded_file.read()
        with open(dest_path, "wb") as f:
            f.write(contents)

        image_obj = ProductImage(
            product_id=product.id,
            image_url=f"/uploads/{safe_name}",
            alt_text=product.name,
            sort_order=current_count + idx
        )
        product.images.append(image_obj)
        db.add(image_obj)

    await db.commit()
    return product

# 3. Categories Management
@router.get("/categories", response_model=List[CategoryOut])
async def admin_list_categories(
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await product_service.list_categories(db, only_active=False)

@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await product_service.create_category(db, data, actor_id=current_owner.id)

@router.patch("/categories/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    cat_res = await db.execute(select(Category).where(Category.id == category_id))
    cat = cat_res.scalars().first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(cat, k, v)
    
    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    cat_res = await db.execute(select(Category).where(Category.id == category_id))
    cat = cat_res.scalars().first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    # Hide / deactivate category safely
    cat.is_active = False
    await db.commit()
    return {"message": "Category deactivated"}

# 4. Order Management
@router.get("/orders", response_model=OrderListOut)
async def admin_list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_status: Optional[str] = Query(None, alias="payment_status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    orders, total = await order_service.list_orders(
        db=db,
        status_filter=status_filter,
        payment_status_filter=payment_status,
        search=search,
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

@router.get("/orders/{order_id}", response_model=OrderOut)
async def admin_get_order(
    order_id: str,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.get_order_by_id(db, order_id)
    if not order:
        order = await order_service.get_order_by_number(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return serialize_order(order)

@router.patch("/orders/{order_id}", response_model=OrderOut)
async def admin_update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.update_status(
        db=db,
        order_id=order_id,
        new_status=data.status,
        notes=data.notes,
        cod_collected=data.cod_collected,
        actor_id=current_owner.id
    )
    return serialize_order(order)

@router.post("/orders/{order_id}/shipments", response_model=OrderOut)
async def admin_add_shipment(
    order_id: str,
    data: ShipmentCreate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.add_shipment(
        db=db,
        order_id=order_id,
        data=data,
        actor_id=current_owner.id
    )
    return serialize_order(order)

# 5. Customers
@router.get("/customers", response_model=List[CustomerSummaryOut])
async def list_customers(
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.list_customers(db)

# 6. Coupons Management
@router.get("/coupons", response_model=List[CouponOut])
async def admin_list_coupons(
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return list(res.scalars().all())

@router.post("/coupons", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
async def admin_create_coupon(
    data: CouponCreate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Coupon).where(Coupon.code == data.code.strip().upper()))
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Coupon code '{data.code}' already exists")

    coupon = Coupon(
        code=data.code.strip().upper(),
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        minimum_order=data.minimum_order,
        usage_limit=data.usage_limit,
        valid_until=data.valid_until,
        is_active=data.is_active
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.patch("/coupons/{coupon_id}", response_model=CouponOut)
async def admin_update_coupon(
    coupon_id: str,
    data: CouponUpdate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalars().first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(coupon, k, v)

    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.delete("/coupons/{coupon_id}")
async def admin_delete_coupon(
    coupon_id: str,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalars().first()
    if coupon:
        coupon.is_active = False
        await db.commit()
    return {"message": "Coupon deactivated"}

# 7. Reports
@router.get("/reports/sales", response_model=SalesReportOut)
async def get_sales_reports(
    days: int = Query(30, ge=1, le=365),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    data = await admin_service.get_sales_report(db, days=days)
    return SalesReportOut(**data)

# 8. Notifications Logs
@router.get("/notifications", response_model=List[NotificationLogOut])
async def list_notifications(
    channel: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    if channel:
        query = query.where(Notification.channel == channel.upper())
    res = await db.execute(query)
    return list(res.scalars().all())

# 9. Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogOut])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    return list(res.scalars().all())

# 10. Image Upload Endpoint
@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_owner: User = Depends(require_owner)
):
    """Secure image upload endpoint."""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF."
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    safe_name = f"prod_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image size exceeds 5MB limit")

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{safe_name}", "filename": safe_name}
