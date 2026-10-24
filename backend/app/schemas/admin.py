from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.order import OrderOut

class BestSellerItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    sku: str
    total_quantity: int
    total_revenue_paise: int

class DashboardStatsOut(BaseModel):
    total_orders: int
    paid_revenue_paise: int
    pending_orders: int
    cod_pending_count: int
    cod_pending_paise: int
    total_products: int
    low_stock_count: int
    recent_orders: List[OrderOut] = []
    best_sellers: List[BestSellerItem] = []
    order_status_counts: Dict[str, int] = {}
    payment_method_counts: Dict[str, int] = {}

class SalesReportOut(BaseModel):
    period: str
    total_orders: int
    total_revenue_paise: int
    average_order_value_paise: int
    by_date: List[Dict[str, Any]] = []
    by_payment_method: Dict[str, int] = {}
    by_status: Dict[str, int] = {}

class AuditLogOut(BaseModel):
    id: str
    actor_user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationLogOut(BaseModel):
    id: str
    order_id: Optional[str] = None
    channel: str
    recipient: str
    template_key: str
    status: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerSummaryOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    orders_count: int
    total_spent_paise: int
