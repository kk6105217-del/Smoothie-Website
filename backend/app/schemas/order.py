from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr

class ItemQuantity(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)

class ShippingAddressInput(BaseModel):
    recipient_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str = Field(..., min_length=6, max_length=6)

class QuoteRequest(BaseModel):
    items: List[ItemQuantity]
    pincode: Optional[str] = None
    coupon_code: Optional[str] = None

class QuoteResponse(BaseModel):
    subtotal_paise: int
    discount_paise: int
    shipping_paise: int
    tax_paise: int
    total_paise: int
    coupon_code: Optional[str] = None
    coupon_message: Optional[str] = None
    is_cod_eligible: bool = True
    estimated_delivery_days: int = 4

class OrderCreateRequest(BaseModel):
    session_token: Optional[str] = None
    items: List[ItemQuantity]
    shipping_address: ShippingAddressInput
    payment_method: str = Field("ONLINE", description="'ONLINE' or 'COD'")
    coupon_code: Optional[str] = None
    notes: Optional[str] = None
    # For guest orders
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None

class OrderItemOut(BaseModel):
    id: str
    product_id: Optional[str] = None
    sku_snapshot: str
    name_snapshot: str
    unit_price_paise: int
    quantity: int
    tax_amount_paise: int
    line_total_paise: int
    image_url_snapshot: Optional[str] = None

    class Config:
        from_attributes = True

class ShipmentOut(BaseModel):
    id: str
    carrier: str
    tracking_number: str
    tracking_url: Optional[str] = None
    status: str
    shipped_at: datetime
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShipmentCreate(BaseModel):
    carrier: str
    tracking_number: str
    tracking_url: Optional[str] = None
    status: str = "SHIPPED"

class PaymentOut(BaseModel):
    id: str
    gateway: str
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    amount_paise: int
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    status: str
    payment_method: str
    payment_status: str
    cod_collected: bool
    address_snapshot: Dict[str, Any]
    subtotal_paise: int
    discount_paise: int
    shipping_paise: int
    tax_paise: int
    total_paise: int
    coupon_code: Optional[str] = None
    cancellation_reason: Optional[str] = None
    return_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []
    payments: List[PaymentOut] = []
    shipments: List[ShipmentOut] = []

    class Config:
        from_attributes = True

class OrderListOut(BaseModel):
    items: List[OrderOut]
    total: int
    page: int
    page_size: int
    total_pages: int

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    cod_collected: Optional[bool] = None

class OrderCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)

class OrderReturnRequest(BaseModel):
    reason: str = Field(..., min_length=5)
