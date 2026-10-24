import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    discount_type = Column(String(20), default="PERCENT", nullable=False)  # "PERCENT" or "FIXED"
    discount_value = Column(Integer, nullable=False)  # e.g., 10 for 10% or 10000 for ₹100
    minimum_order = Column(Integer, default=0, nullable=False)  # in paise
    usage_limit = Column(Integer, default=1000, nullable=False)
    times_used = Column(Integer, default=0, nullable=False)
    valid_from = Column(DateTime, default=utc_now, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
