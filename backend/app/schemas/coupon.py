from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CouponCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    discount_type: str = Field("PERCENT", description="'PERCENT' or 'FIXED'")
    discount_value: int = Field(..., ge=1, description="Percentage (e.g. 10 for 10%) or paise (e.g. 5000 for ₹50)")
    minimum_order: int = Field(0, ge=0, description="Minimum order subtotal in paise")
    usage_limit: int = Field(1000, ge=1)
    valid_until: Optional[datetime] = None
    is_active: bool = True

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[int] = Field(None, ge=1)
    minimum_order: Optional[int] = Field(None, ge=0)
    usage_limit: Optional[int] = Field(None, ge=1)
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None

class CouponOut(BaseModel):
    id: str
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: int
    minimum_order: int
    usage_limit: int
    times_used: int
    valid_from: datetime
    valid_until: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CouponApplyRequest(BaseModel):
    code: str
    cart_subtotal_paise: int

class CouponApplyResponse(BaseModel):
    is_valid: bool
    code: str
    discount_paise: int
    message: str
