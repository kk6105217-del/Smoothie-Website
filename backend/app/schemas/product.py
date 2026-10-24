from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Category Schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True

# Spec & Image Schemas
class ProductSpecSchema(BaseModel):
    spec_name: str
    spec_value: str

class ProductImageSchema(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    sort_order: int = 0

class ProductImageOut(BaseModel):
    id: str
    image_url: str
    alt_text: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True

class ProductSpecOut(BaseModel):
    id: str
    spec_name: str
    spec_value: str

    class Config:
        from_attributes = True

# Product Schemas
class ProductCreate(BaseModel):
    category_id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    sku: str = Field(..., min_length=2, max_length=100)
    brand: Optional[str] = "DIY Tech"
    short_description: Optional[str] = None
    description: str
    features: Optional[str] = None
    price: int = Field(..., ge=1, description="Price in paise (₹1 = 100 paise)")
    sale_price: Optional[int] = Field(None, ge=1, description="Sale price in paise")
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    is_published: bool = True
    is_featured: bool = False
    weight_grams: Optional[int] = None
    package_dimensions: Optional[str] = None
    package_contents: Optional[str] = None
    compatibility_info: Optional[str] = None
    warranty_info: Optional[str] = "6 Months Manufacturing Warranty"
    return_eligible: bool = True
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    images: List[ProductImageSchema] = []
    specs: List[ProductSpecSchema] = []

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    sku: Optional[str] = None
    brand: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    features: Optional[str] = None
    price: Optional[int] = Field(None, ge=1)
    sale_price: Optional[int] = Field(None, ge=1)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_archived: Optional[bool] = None
    weight_grams: Optional[int] = None
    package_dimensions: Optional[str] = None
    package_contents: Optional[str] = None
    compatibility_info: Optional[str] = None
    warranty_info: Optional[str] = None
    return_eligible: Optional[bool] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    images: Optional[List[ProductImageSchema]] = None
    specs: Optional[List[ProductSpecSchema]] = None

class ProductPublishRequest(BaseModel):
    is_published: bool = True

class ReviewOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: str = Field(..., min_length=5)

class ProductOut(BaseModel):
    id: str
    category_id: Optional[str] = None
    name: str
    slug: str
    sku: str
    brand: Optional[str] = None
    short_description: Optional[str] = None
    description: str
    features: Optional[str] = None
    price: int
    sale_price: Optional[int] = None
    stock_quantity: int
    low_stock_threshold: int
    is_published: bool
    is_featured: bool
    is_archived: bool
    weight_grams: Optional[int] = None
    package_dimensions: Optional[str] = None
    package_contents: Optional[str] = None
    compatibility_info: Optional[str] = None
    warranty_info: Optional[str] = None
    return_eligible: bool
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    created_at: datetime
    category: Optional[CategoryOut] = None
    images: List[ProductImageOut] = []
    specs: List[ProductSpecOut] = []
    reviews: List[ReviewOut] = []

    class Config:
        from_attributes = True

class ProductListOut(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int
