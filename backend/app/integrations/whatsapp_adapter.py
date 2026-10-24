import uuid
import httpx
from typing import Dict, Any, Tuple
from app.core.config import settings

class WhatsAppAdapter:
    def __init__(self):
        self.api_token = settings.WHATSAPP_API_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID

    def format_message(self, template_key: str, data: Dict[str, Any]) -> str:
        store = settings.PROJECT_NAME
        if template_key in ["ORDER_CONFIRMED", "COD_ORDER_PLACED"]:
            return (
                f"🎉 *{store} Order Confirmation*\n\n"
                f"Hi {data.get('customer_name', 'Customer')}, your order *#{data.get('order_number')}* has been placed!\n"
                f"• Amount: ₹{data.get('total_inr', 0):.2f}\n"
                f"• Payment: {data.get('payment_method')} ({data.get('payment_status')})\n"
                f"• Deliver to: {data.get('city', 'Your address')}, {data.get('pincode', '')}\n\n"
                f"Track status on our store: https://vktechnology.in/track-order"
            )
        elif template_key == "ORDER_SHIPPED":
            track_link = f"Link: {data.get('tracking_url')}" if data.get("tracking_url") else ""
            return (
                f"🚚 *{store} Shipment Update*\n\n"
                f"Order *#{data.get('order_number')}* is shipped via {data.get('carrier')}!\n"
                f"Tracking Number: {data.get('tracking_number')}\n"
                f"{track_link}"
            )
        elif template_key == "OWNER_NEW_ORDER":
            return (
                f"🔔 *[VK Technology] New Order for Karthik*\n"
                f"Order: #{data.get('order_number')}\n"
                f"Total: ₹{data.get('total_inr', 0):.2f} via {data.get('payment_method')}\n"
                f"Customer: {data.get('customer_name')} ({data.get('customer_phone')})\n"
                f"Destination: {data.get('city', '')} - {data.get('pincode', '')}"
            )
        elif template_key == "OWNER_PAYMENT_VERIFIED":
            return (
                f"💰 *[VK Technology] Payment Received for Karthik*\n"
                f"Order: #{data.get('order_number')}\n"
                f"Verified Amount: ₹{data.get('amount_inr', 0):.2f}\n"
                f"Gateway Ref: {data.get('payment_id')}"
            )
        return f"[{store}] Update regarding your order: {data.get('message', '')}"

    async def send(self, phone: str, template_key: str, data: Dict[str, Any]) -> Tuple[bool, str, str]:
        message_text = self.format_message(template_key, data)
        if self.api_token and self.phone_number_id and not settings.MOCK_NOTIFICATIONS:
            try:
                clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
                url = f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"
                payload = {
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message_text}
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {self.api_token}"},
                        json=payload,
                        timeout=10.0
                    )
                    res.raise_for_status()
                    msg_id = res.json().get("messages", [{}])[0].get("id", str(uuid.uuid4()))
                    return True, msg_id, ""
            except Exception as e:
                return False, "", str(e)
        else:
            msg_id = f"mock_wa_{uuid.uuid4().hex[:10]}"
            return True, msg_id, ""

whatsapp_adapter = WhatsAppAdapter()
