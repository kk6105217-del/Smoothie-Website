import uuid
import httpx
from typing import Dict, Any, Tuple
from app.core.config import settings

class EmailAdapter:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL

    def render_template(self, template_key: str, data: Dict[str, Any]) -> Tuple[str, str]:
        """Renders subject and HTML email content."""
        store_name = settings.PROJECT_NAME

        if template_key == "ORDER_CONFIRMED" or template_key == "COD_ORDER_PLACED":
            subject = f"Your {store_name} order #{data.get('order_number')} is confirmed"
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0b1d3a; margin-bottom: 8px;">Hi {data.get('customer_name', 'Tech Maker')},</h2>
                <p style="color: #475569; font-size: 15px;">Thank you for shopping with <strong>{store_name}</strong>. Your order has been placed successfully.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Order Number:</strong> {data.get('order_number')}</p>
                    <p style="margin: 4px 0;"><strong>Order Total:</strong> ₹{data.get('total_inr', 0):.2f}</p>
                    <p style="margin: 4px 0;"><strong>Payment Method:</strong> {data.get('payment_method')}</p>
                    <p style="margin: 4px 0;"><strong>Payment Status:</strong> {data.get('payment_status')}</p>
                    <p style="margin: 4px 0;"><strong>Delivery Address:</strong> {data.get('delivery_address')}</p>
                </div>
                <p style="color: #475569;">You can track the progress of your shipment on our website at any time.</p>
                <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    Thank you for choosing {store_name}! Need help? Reach out to Karthik at karthik.suroju@gmail.com or call +91 8555997052
                </p>
            </div>
            """
            return subject, html

        elif template_key == "OWNER_NEW_ORDER":
            subject = f"🔔 [VK Technology Owner Alert] New Order #{data.get('order_number')} - ₹{data.get('total_inr', 0):.2f}"
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0891b2; border-radius: 8px;">
                <h2 style="color: #0b1d3a; margin-bottom: 8px;">Hi Karthik,</h2>
                <p style="color: #0891b2; font-weight: bold; font-size: 16px;">You have received a new order on VK Technology!</p>
                <div style="background-color: #f0fdfa; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #99f6e4;">
                    <p style="margin: 4px 0;"><strong>Order Number:</strong> #{data.get('order_number')}</p>
                    <p style="margin: 4px 0;"><strong>Customer Name:</strong> {data.get('customer_name')}</p>
                    <p style="margin: 4px 0;"><strong>Customer Phone:</strong> {data.get('customer_phone')}</p>
                    <p style="margin: 4px 0;"><strong>Order Amount:</strong> ₹{data.get('total_inr', 0):.2f}</p>
                    <p style="margin: 4px 0;"><strong>Payment Method:</strong> {data.get('payment_method')}</p>
                    <p style="margin: 4px 0;"><strong>Payment Status:</strong> {data.get('payment_status')}</p>
                    <p style="margin: 4px 0;"><strong>Shipping Destination:</strong> {data.get('delivery_address')}</p>
                </div>
                <p style="color: #475569;">Please log in to the Owner Console to review and dispatch this order.</p>
            </div>
            """
            return subject, html

        elif template_key == "OWNER_PAYMENT_VERIFIED":
            subject = f"💰 [VK Technology Payment Received] Order #{data.get('order_number')} - ₹{data.get('amount_inr', 0):.2f}"
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
                <h2 style="color: #065f46;">Payment Confirmed</h2>
                <p>Payment of <strong>₹{data.get('amount_inr', 0):.2f}</strong> for order <strong>#{data.get('order_number')}</strong> has been cryptographically verified via Razorpay.</p>
                <p>Transaction / Gateway Payment ID: <code>{data.get('payment_id')}</code></p>
            </div>
            """
            return subject, html

        elif template_key == "ORDER_SHIPPED":
            subject = f"Your {store_name} order #{data.get('order_number')} has been shipped!"
            tracking_url = data.get("tracking_url")
            tracking_html = f'<p style="margin: 4px 0;"><a href="{tracking_url}" style="color: #0891b2; text-decoration: underline;">Click here to track your shipment</a></p>' if tracking_url else ""
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0b1d3a;">Great news! Your package is on its way</h2>
                <p style="color: #475569;">Your order <strong>#{data.get('order_number')}</strong> has been handed over to <strong>{data.get('carrier')}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Tracking Number:</strong> {data.get('tracking_number')}</p>
                    {tracking_html}
                </div>
            </div>
            """
            return subject, html

        elif template_key == "LOW_STOCK_ALERT":
            subject = f"⚠️ [VK Technology Owner Alert] Low Stock Warning for {data.get('product_name')}"
            html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h3 style="color: #b91c1c;">Inventory Alert for Karthik</h3>
                <p>Product <strong>{data.get('product_name')}</strong> (SKU: {data.get('sku')}) is running low!</p>
                <p>Current stock: <strong>{data.get('current_stock')}</strong> (Threshold: {data.get('threshold')})</p>
                <p>Please restock this item soon in the VK Technology owner admin dashboard.</p>
            </div>
            """
            return subject, html

        else:
            subject = f"{store_name} Notification: {template_key}"
            html = f"<p>{data.get('message', 'You have an update regarding your order.')}</p>"
            return subject, html

    async def send(self, recipient_email: str, template_key: str, data: Dict[str, Any]) -> Tuple[bool, str, str]:
        """Dispatches email or simulates delivery."""
        subject, html = self.render_template(template_key, data)

        if self.api_key and not settings.MOCK_NOTIFICATIONS:
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(
                        "https://api.resend.com/emails",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={
                            "from": self.from_email,
                            "to": [recipient_email],
                            "subject": subject,
                            "html": html
                        },
                        timeout=10.0
                    )
                    res.raise_for_status()
                    msg_id = res.json().get("id", str(uuid.uuid4()))
                    return True, msg_id, ""
            except Exception as e:
                return False, "", str(e)
        else:
            # Safe mock recording
            msg_id = f"mock_email_{uuid.uuid4().hex[:10]}"
            return True, msg_id, ""

email_adapter = EmailAdapter()
