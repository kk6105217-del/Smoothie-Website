from typing import Optional
from pydantic import BaseModel

class PaymentCreateRequest(BaseModel):
    order_id: str

class PaymentCreateResponse(BaseModel):
    order_id: str
    order_number: str
    gateway: str
    gateway_order_id: str
    razorpay_key_id: Optional[str] = None
    amount_paise: int
    currency: str = "INR"

class PaymentVerifyRequest(BaseModel):
    order_id: str
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: Optional[str] = None

class PaymentVerifyResponse(BaseModel):
    success: bool
    message: str
    payment_status: str
    order_status: str

class RefundCreateRequest(BaseModel):
    amount_paise: int
    reason: str
