import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderItem, Payment
from app.models.product import Product
from app.models.user import User
from app.models.notification import Notification
from app.models.settings import AuditLog, StoreSetting
from app.schemas.admin import DashboardStatsOut, BestSellerItem, SalesReportOut, CustomerSummaryOut

class AdminService:
    async def get_dashboard_stats(self, db: AsyncSession) -> Dict[str, Any]:
        # 1. Total Orders
        total_orders_res = await db.execute(select(func.count(Order.id)))
        total_orders = total_orders_res.scalar_one()

        # 2. Paid Revenue: Strictly count paid orders (never pending or failed)
        revenue_res = await db.execute(
            select(func.sum(Order.total_paise))
            .where(Order.payment_status == "PAID", Order.status != "CANCELLED")
        )
        paid_revenue_paise = revenue_res.scalar_one() or 0

        # 3. Pending Orders
        pending_orders_res = await db.execute(
            select(func.count(Order.id))
            .where(Order.status.in_(["PENDING", "CONFIRMED", "PROCESSING", "PACKED"]))
        )
        pending_orders = pending_orders_res.scalar_one()

        # 4. COD Orders awaiting collection
        cod_res = await db.execute(
            select(func.count(Order.id), func.sum(Order.total_paise))
            .where(Order.payment_method == "COD", Order.cod_collected == False, Order.status != "CANCELLED")
        )
        cod_row = cod_res.first()
        cod_pending_count = cod_row[0] or 0
        cod_pending_paise = cod_row[1] or 0

        # 5. Products Count & Low Stock Count
        total_prods_res = await db.execute(select(func.count(Product.id)).where(Product.is_archived == False))
        total_products = total_prods_res.scalar_one()

        low_stock_res = await db.execute(
            select(func.count(Product.id)).where(
                Product.stock_quantity <= Product.low_stock_threshold,
                Product.is_archived == False
            )
        )
        low_stock_count = low_stock_res.scalar_one()

        # 6. Recent Orders
        recent_res = await db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.payments), selectinload(Order.shipments))
            .order_by(Order.created_at.desc())
            .limit(10)
        )
        recent_orders = list(recent_res.scalars().all())

        # 7. Best Sellers (aggregated from order items)
        best_sellers_res = await db.execute(
            select(
                OrderItem.product_id,
                OrderItem.name_snapshot,
                OrderItem.sku_snapshot,
                func.sum(OrderItem.quantity).label("total_qty"),
                func.sum(OrderItem.line_total_paise).label("total_rev")
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status != "CANCELLED")
            .group_by(OrderItem.product_id, OrderItem.name_snapshot, OrderItem.sku_snapshot)
            .order_by(desc("total_qty"))
            .limit(5)
        )
        best_sellers = []
        for row in best_sellers_res.all():
            best_sellers.append(BestSellerItem(
                product_id=row[0],
                name=row[1],
                sku=row[2],
                total_quantity=row[3] or 0,
                total_revenue_paise=row[4] or 0
            ))

        # 8. Status counts
        status_res = await db.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        )
        order_status_counts = {row[0]: row[1] for row in status_res.all()}

        # 9. Payment method counts
        payment_res = await db.execute(
            select(Order.payment_method, func.count(Order.id)).group_by(Order.payment_method)
        )
        payment_method_counts = {row[0]: row[1] for row in payment_res.all()}

        return {
            "total_orders": total_orders,
            "paid_revenue_paise": paid_revenue_paise,
            "pending_orders": pending_orders,
            "cod_pending_count": cod_pending_count,
            "cod_pending_paise": cod_pending_paise,
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "recent_orders": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "guest_name": o.guest_name,
                    "guest_email": o.guest_email,
                    "guest_phone": o.guest_phone,
                    "status": o.status,
                    "payment_method": o.payment_method,
                    "payment_status": o.payment_status,
                    "cod_collected": o.cod_collected,
                    "address_snapshot": json.loads(o.address_snapshot) if o.address_snapshot else {},
                    "subtotal_paise": o.subtotal_paise,
                    "discount_paise": o.discount_paise,
                    "shipping_paise": o.shipping_paise,
                    "tax_paise": o.tax_paise,
                    "total_paise": o.total_paise,
                    "coupon_code": o.coupon_code,
                    "created_at": o.created_at,
                    "items": o.items,
                    "payments": o.payments,
                    "shipments": o.shipments
                } for o in recent_orders
            ],
            "best_sellers": best_sellers,
            "order_status_counts": order_status_counts,
            "payment_method_counts": payment_method_counts
        }

    async def get_sales_report(self, db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        orders_res = await db.execute(
            select(Order).where(Order.created_at >= since, Order.status != "CANCELLED")
        )
        orders = list(orders_res.scalars().all())

        total_rev = sum(o.total_paise for o in orders if o.payment_status == "PAID")
        total_orders = len(orders)
        aov = (total_rev // total_orders) if total_orders > 0 else 0

        # Group by day
        by_date_map: Dict[str, Dict[str, Any]] = {}
        by_payment: Dict[str, int] = {}
        by_status: Dict[str, int] = {}

        for o in orders:
            d_str = o.created_at.strftime("%Y-%m-%d")
            if d_str not in by_date_map:
                by_date_map[d_str] = {"date": d_str, "orders": 0, "revenue_paise": 0}
            by_date_map[d_str]["orders"] += 1
            if o.payment_status == "PAID":
                by_date_map[d_str]["revenue_paise"] += o.total_paise

            by_payment[o.payment_method] = by_payment.get(o.payment_method, 0) + 1
            by_status[o.status] = by_status.get(o.status, 0) + 1

        return {
            "period": f"Last {days} days",
            "total_orders": total_orders,
            "total_revenue_paise": total_rev,
            "average_order_value_paise": aov,
            "by_date": sorted(list(by_date_map.values()), key=lambda x: x["date"]),
            "by_payment_method": by_payment,
            "by_status": by_status
        }

    async def list_customers(self, db: AsyncSession) -> List[CustomerSummaryOut]:
        users_res = await db.execute(select(User).where(User.role == "CUSTOMER").order_by(User.created_at.desc()))
        users = list(users_res.scalars().all())

        result = []
        for u in users:
            orders_res = await db.execute(select(Order).where(Order.user_id == u.id, Order.status != "CANCELLED"))
            orders = list(orders_res.scalars().all())
            spent = sum(o.total_paise for o in orders if o.payment_status == "PAID")
            result.append(CustomerSummaryOut(
                id=u.id,
                name=u.name,
                email=u.email,
                phone=u.phone,
                created_at=u.created_at,
                orders_count=len(orders),
                total_spent_paise=spent
            ))
        return result

admin_service = AdminService()
