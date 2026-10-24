from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.product import ProductOut

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1)
    session_token: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItemOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    product: ProductOut
    line_total_paise: int

class CartOut(BaseModel):
    id: str
    session_token: Optional[str] = None
    items: List[CartItemOut] = []
    subtotal_paise: int
    total_items: int

class WishlistToggleRequest(BaseModel):
    product_id: str

class WishlistItemOut(BaseModel):
    id: str
    product_id: str
    product: ProductOut
    created_at: datetime

    class Config:
        from_attributes = True
