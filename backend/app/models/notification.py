import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(String(20), nullable=False, index=True)  # "EMAIL", "WHATSAPP", "SMS"
    recipient = Column(String(255), nullable=False)
    template_key = Column(String(100), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # "PENDING", "SENT", "FAILED"
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    order = relationship("Order", back_populates="notifications")
