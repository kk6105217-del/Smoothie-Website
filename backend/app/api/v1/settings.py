from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.dependencies import require_owner
from app.models.user import User
from app.models.settings import StoreSetting
from app.schemas.settings import StoreSettingsResponse, StoreSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Store Settings"])

@router.get("", response_model=StoreSettingsResponse)
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Public store settings for currency, contact info, and policies."""
    res = await db.execute(select(StoreSetting))
    db_settings = {s.setting_key: s.setting_value for s in res.scalars().all()}

    return StoreSettingsResponse(
        store_name=db_settings.get("store_name", "VK Technology – DIY Tech Projects"),
        currency=db_settings.get("currency", "INR"),
        currency_symbol="₹",
        contact_email=db_settings.get("contact_email", "karthik.suroju@gmail.com"),
        contact_phone=db_settings.get("contact_phone", "+91 8555997052"),
        whatsapp_number=db_settings.get("whatsapp_number", "+91 8555997052"),
        default_shipping_paise=int(db_settings.get("default_shipping_paise", 7000)),
        free_shipping_threshold_paise=int(db_settings.get("free_shipping_threshold_paise", 99900)),
        tax_rate_percent=float(db_settings.get("tax_rate_percent", 18.0)),
        cod_enabled=db_settings.get("cod_enabled", "true").lower() == "true",
        cod_max_limit_paise=int(db_settings.get("cod_max_limit_paise", 2500000)),
        return_window_days=int(db_settings.get("return_window_days", 7)),
        email_notifications_enabled=db_settings.get("email_notifications_enabled", "true").lower() == "true",
        whatsapp_notifications_enabled=db_settings.get("whatsapp_notifications_enabled", "true").lower() == "true",
        sms_notifications_enabled=db_settings.get("sms_notifications_enabled", "true").lower() == "true",
        promotional_banners=db_settings.get("promotional_banners", None),
    )

@router.patch("/admin", response_model=StoreSettingsResponse)
async def update_settings(
    data: StoreSettingsUpdate,
    current_owner: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
):
    """Owner updates store settings."""
    for key, value in data.settings.items():
        res = await db.execute(select(StoreSetting).where(StoreSetting.setting_key == key))
        existing = res.scalars().first()
        if existing:
            existing.setting_value = str(value)
        else:
            db.add(StoreSetting(setting_key=key, setting_value=str(value)))

    await db.commit()
    return await get_public_settings(db)
