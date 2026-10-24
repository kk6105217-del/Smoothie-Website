import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    guest_name = Column(String(255), nullable=True)
    guest_email = Column(String(255), nullable=True)
    guest_phone = Column(String(30), nullable=True)

    # Fulfilment Status:
    # PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED
    status = Column(String(50), default="PENDING", nullable=False, index=True)

    # Payment details
    payment_method = Column(String(20), default="ONLINE", nullable=False)  # "ONLINE", "COD"
    payment_status = Column(String(30), default="PENDING", nullable=False, index=True)  # "PENDING", "PAID", "FAILED", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"
    cod_collected = Column(Boolean, default=False, nullable=False)

    # Immutable JSON snapshot of delivery address
    address_snapshot = Column(Text, nullable=False)

    # Money in exact integer paise
    subtotal_paise = Column(Integer, nullable=False)
    discount_paise = Column(Integer, default=0, nullable=False)
    shipping_paise = Column(Integer, default=0, nullable=False)
    tax_paise = Column(Integer, default=0, nullable=False)
    total_paise = Column(Integer, nullable=False)

    coupon_code = Column(String(50), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    return_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="order", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    
    sku_snapshot = Column(String(100), nullable=False)
    name_snapshot = Column(String(255), nullable=False)
    unit_price_paise = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    tax_amount_paise = Column(Integer, default=0, nullable=False)
    line_total_paise = Column(Integer, nullable=False)
    image_url_snapshot = Column(String(1000), nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    gateway = Column(String(50), default="RAZORPAY", nullable=False)  # "RAZORPAY", "COD", "MOCK"
    gateway_order_id = Column(String(255), nullable=True, index=True)
    gateway_payment_id = Column(String(255), nullable=True, index=True)
    gateway_signature = Column(String(500), nullable=True)
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)  # "PENDING", "PAID", "FAILED"
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    order = relationship("Order", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    carrier = Column(String(100), nullable=False)  # e.g., "Delhivery", "BlueDart", "DTDC"
    tracking_number = Column(String(100), nullable=False, index=True)
    tracking_url = Column(String(1000), nullable=True)
    status = Column(String(50), default="SHIPPED", nullable=False)  # "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"
    shipped_at = Column(DateTime, default=utc_now, nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    order = relationship("Order", back_populates="shipments")

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    payment_id = Column(String(36), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    gateway_refund_id = Column(String(255), nullable=True)
    status = Column(String(30), default="COMPLETED", nullable=False)  # "PENDING", "COMPLETED", "FAILED"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    payment = relationship("Payment", back_populates="refunds")
