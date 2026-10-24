import uuid
import httpx
from typing import Dict, Any, Tuple
from app.core.config import settings

class SMSAdapter:
    def __init__(self):
        self.api_key = settings.SMS_API_KEY
        self.sender_id = settings.SMS_SENDER_ID

    def format_sms(self, template_key: str, data: Dict[str, Any]) -> str:
        store = settings.PROJECT_NAME
        if template_key in ["ORDER_CONFIRMED", "COD_ORDER_PLACED"]:
            return f"Your {store} order #{data.get('order_number')} of Rs.{data.get('total_inr', 0):.0f} is confirmed. Track online."
        elif template_key == "ORDER_SHIPPED":
            return f"Your {store} order #{data.get('order_number')} is dispatched via {data.get('carrier')}. AWB: {data.get('tracking_number')}."
        return f"{store}: Update on your order #{data.get('order_number', '')}."

    async def send(self, phone: str, template_key: str, data: Dict[str, Any]) -> Tuple[bool, str, str]:
        sms_text = self.format_sms(template_key, data)
        if self.api_key and not settings.MOCK_NOTIFICATIONS:
            try:
                clean_phone = phone.replace("+91", "").replace(" ", "").replace("-", "")
                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "route": "v3",
                    "sender_id": self.sender_id,
                    "message": sms_text,
                    "language": "english",
                    "flash": 0,
                    "numbers": clean_phone
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(
                        url,
                        headers={"authorization": self.api_key},
                        json=payload,
                        timeout=10.0
                    )
                    res.raise_for_status()
                    msg_id = res.json().get("request_id", str(uuid.uuid4()))
                    return True, msg_id, ""
            except Exception as e:
                return False, "", str(e)
        else:
            msg_id = f"mock_sms_{uuid.uuid4().hex[:10]}"
            return True, msg_id, ""

sms_adapter = SMSAdapter()
