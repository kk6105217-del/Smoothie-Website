import re
import json
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc, asc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.product import Product, Category, ProductImage, ProductSpec
from app.models.review import Review
from app.models.settings import AuditLog
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return re.sub(r'^-+|-+$', '', text)

class ProductService:
    async def list_categories(self, db: AsyncSession, only_active: bool = True) -> List[Category]:
        query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
        if only_active:
            query = query.where(Category.is_active == True)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_category(self, db: AsyncSession, category_id_or_slug: str) -> Optional[Category]:
        query = select(Category).where(
            or_(Category.id == category_id_or_slug, Category.slug == category_id_or_slug)
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def create_category(self, db: AsyncSession, data: CategoryCreate, actor_id: Optional[str] = None) -> Category:
        slug = data.slug or slugify(data.name)
        # Check slug uniqueness
        existing = await self.get_category(db, slug)
        if existing:
            slug = f"{slug}-{uuid_short()}"

        category = Category(
            name=data.name,
            slug=slug,
            description=data.description,
            image_url=data.image_url,
            is_active=data.is_active,
            sort_order=data.sort_order
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    async def list_products(
        self,
        db: AsyncSession,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        category_id: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        in_stock_only: bool = False,
        featured_only: bool = False,
        include_archived: bool = False,
        only_published: bool = True,
        sort_by: str = "newest",  # newest, price_asc, price_desc, popularity
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Product], int]:
        query = select(Product).options(
            selectinload(Product.category),
            selectinload(Product.images),
            selectinload(Product.specs),
            selectinload(Product.reviews)
        )

        if not include_archived:
            query = query.where(Product.is_archived == False)
        if only_published:
            query = query.where(Product.is_published == True)
        if featured_only:
            query = query.where(Product.is_featured == True)
        if in_stock_only:
            query = query.where(Product.stock_quantity > 0)
        if min_price is not None:
            query = query.where(Product.price >= min_price)
        if max_price is not None:
            query = query.where(Product.price <= max_price)

        if category_slug:
            cat = await self.get_category(db, category_slug)
            if cat:
                query = query.where(Product.category_id == cat.id)
            else:
                return [], 0
        elif category_id:
            query = query.where(Product.category_id == category_id)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.short_description.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.order_by(None).subquery())
        total = (await db.execute(count_query)).scalar_one()

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "popularity":
            query = query.order_by(Product.is_featured.desc(), Product.created_at.desc())
        else:  # newest
            query = query.order_by(Product.created_at.desc())

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_product_by_slug(self, db: AsyncSession, slug: str) -> Optional[Product]:
        query = select(Product).options(
            selectinload(Product.category),
            selectinload(Product.images),
            selectinload(Product.specs),
            selectinload(Product.reviews)
        ).where(Product.slug == slug, Product.is_archived == False)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_product_by_id(self, db: AsyncSession, product_id: str) -> Optional[Product]:
        query = select(Product).options(
            selectinload(Product.category),
            selectinload(Product.images),
            selectinload(Product.specs),
            selectinload(Product.reviews)
        ).where(Product.id == product_id)
        result = await db.execute(query)
        return result.scalars().first()

    async def create_product(self, db: AsyncSession, data: ProductCreate, actor_id: Optional[str] = None) -> Product:
        # Check SKU uniqueness
        sku_check = await db.execute(select(Product).where(Product.sku == data.sku.strip()))
        if sku_check.scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product with SKU '{data.sku}' already exists")

        slug = data.slug or slugify(data.name)
        slug_check = await db.execute(select(Product).where(Product.slug == slug))
        if slug_check.scalars().first():
            slug = f"{slug}-{data.sku.lower()}"

        product = Product(
            category_id=data.category_id,
            name=data.name,
            slug=slug,
            sku=data.sku.strip(),
            brand=data.brand,
            short_description=data.short_description,
            description=data.description,
            features=data.features,
            price=data.price,
            sale_price=data.sale_price,
            stock_quantity=data.stock_quantity,
            low_stock_threshold=data.low_stock_threshold,
            is_published=data.is_published,
            is_featured=data.is_featured,
            weight_grams=data.weight_grams,
            package_dimensions=data.package_dimensions,
            package_contents=data.package_contents,
            compatibility_info=data.compatibility_info,
            warranty_info=data.warranty_info,
            return_eligible=data.return_eligible,
            seo_title=data.seo_title,
            seo_description=data.seo_description
        )
        db.add(product)
        await db.flush()

        # Add images
        for idx, img in enumerate(data.images):
            image_obj = ProductImage(
                product_id=product.id,
                image_url=img.image_url,
                alt_text=img.alt_text or product.name,
                sort_order=img.sort_order if img.sort_order is not None else idx
            )
            db.add(image_obj)

        # Add specs
        for spec in data.specs:
            spec_obj = ProductSpec(
                product_id=product.id,
                spec_name=spec.spec_name,
                spec_value=spec.spec_value
            )
            db.add(spec_obj)

        # Audit log
        db.add(AuditLog(
            actor_user_id=actor_id,
            action="PRODUCT_CREATE",
            entity_type="Product",
            entity_id=product.id,
            metadata_json=json.dumps({"name": product.name, "sku": product.sku, "price": product.price})
        ))

        await db.commit()
        return await self.get_product_by_id(db, product.id)

    async def update_product(self, db: AsyncSession, product_id: str, data: ProductUpdate, actor_id: Optional[str] = None) -> Product:
        product = await self.get_product_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        update_dict = data.model_dump(exclude_unset=True)
        images = update_dict.pop("images", None)
        specs = update_dict.pop("specs", None)

        for key, val in update_dict.items():
            setattr(product, key, val)

        if images is not None:
            # Replace images
            await db.execute(select(ProductImage).where(ProductImage.product_id == product.id))
            for old_img in product.images:
                await db.delete(old_img)
            for idx, img in enumerate(images):
                db.add(ProductImage(
                    product_id=product.id,
                    image_url=img["image_url"],
                    alt_text=img.get("alt_text") or product.name,
                    sort_order=img.get("sort_order", idx)
                ))

        if specs is not None:
            for old_spec in product.specs:
                await db.delete(old_spec)
            for spec in specs:
                db.add(ProductSpec(
                    product_id=product.id,
                    spec_name=spec["spec_name"],
                    spec_value=spec["spec_value"]
                ))

        # Audit log
        db.add(AuditLog(
            actor_user_id=actor_id,
            action="PRODUCT_UPDATE",
            entity_type="Product",
            entity_id=product.id,
            metadata_json=json.dumps(update_dict)
        ))

        await db.commit()
        return await self.get_product_by_id(db, product.id)

    async def archive_product(self, db: AsyncSession, product_id: str, actor_id: Optional[str] = None) -> Product:
        product = await self.get_product_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
        # Soft delete / archive to protect existing orders
        product.is_archived = True
        product.is_published = False

        db.add(AuditLog(
            actor_user_id=actor_id,
            action="PRODUCT_ARCHIVE",
            entity_type="Product",
            entity_id=product.id
        ))

        await db.commit()
        await db.refresh(product)
        return product

def uuid_short():
    import uuid
    return uuid.uuid4().hex[:6]

product_service = ProductService()
