import json
from fastapi import APIRouter, Depends, Request, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.payment_service import payment_service

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives and processes cryptographically verified Razorpay webhooks.
    Enforces idempotent processing to prevent duplicate stock or payment commits.
    """
    raw_body = await request.body()
    try:
        event_data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    return await payment_service.handle_webhook(
        db=db,
        raw_body=raw_body,
        signature=x_razorpay_signature or "",
        event_data=event_data
    )
