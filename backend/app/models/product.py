import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    brand = Column(String(100), nullable=True, default="DIY Tech")
    short_description = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    features = Column(Text, nullable=True)
    
    # Prices stored in integer paise (₹1 = 100 paise)
    price = Column(Integer, nullable=False)  # Regular price in paise
    sale_price = Column(Integer, nullable=True)  # Sale price in paise
    
    stock_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    
    is_published = Column(Boolean, default=True, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    
    weight_grams = Column(Integer, nullable=True)
    package_dimensions = Column(String(100), nullable=True)
    package_contents = Column(Text, nullable=True)
    compatibility_info = Column(Text, nullable=True)
    warranty_info = Column(String(255), nullable=True, default="6 Months Manufacturing Warranty")
    return_eligible = Column(Boolean, default=True, nullable=False)
    
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_product_search", "name", "brand", "is_published", "is_archived"),
    )

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(1000), nullable=False)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="images")

class ProductSpec(Base):
    __tablename__ = "product_specs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    spec_name = Column(String(100), nullable=False)
    spec_value = Column(String(500), nullable=False)

    product = relationship("Product", back_populates="specs")
