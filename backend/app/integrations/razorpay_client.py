import hmac
import hashlib
import uuid
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class RazorpayClient:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.is_configured = bool(self.key_id and self.key_secret)

    async def create_order(self, amount_paise: int, receipt: str, notes: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Creates an order in Razorpay or returns an authentic sandbox order if unconfigured."""
        if self.is_configured and not settings.MOCK_PAYMENTS:
            url = "https://api.razorpay.com/v1/orders"
            data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
                "notes": notes or {},
                "payment_capture": 1
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=data, auth=(self.key_id, self.key_secret))
                res.raise_for_status()
                return res.json()
        else:
            # High-fidelity mock/sandbox Razorpay order
            mock_id = f"order_{uuid.uuid4().hex[:14]}"
            return {
                "id": mock_id,
                "entity": "order",
                "amount": amount_paise,
                "amount_paid": 0,
                "amount_due": amount_paise,
                "currency": "INR",
                "receipt": receipt,
                "status": "created",
                "attempts": 0,
                "notes": notes or {},
                "created_at": 1700000000
            }

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """Verifies cryptographic signature sent from Razorpay client."""
        if not self.is_configured or settings.MOCK_PAYMENTS:
            # In sandbox / mock mode, accept verified mock tokens or simulation signatures
            return True
        
        payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, razorpay_signature)

    def verify_webhook_signature(self, raw_body: bytes, received_signature: str) -> bool:
        """Verifies webhook signature using Razorpay webhook secret."""
        if not self.webhook_secret or settings.MOCK_PAYMENTS:
            return True
        
        expected_signature = hmac.new(
            self.webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, received_signature)

razorpay_client = RazorpayClient()
