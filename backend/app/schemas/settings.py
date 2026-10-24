from typing import Dict, Any, Optional
from pydantic import BaseModel

class StoreSettingItem(BaseModel):
    setting_key: str
    setting_value: str
    description: Optional[str] = None

class StoreSettingsUpdate(BaseModel):
    settings: Dict[str, str]

class StoreSettingsResponse(BaseModel):
    store_name: str = "VK Technology – DIY Tech Projects"
    currency: str = "INR"
    currency_symbol: str = "₹"
    contact_email: str = "karthik.suroju@gmail.com"
    contact_phone: str = "+91 8555997052"
    whatsapp_number: str = "+91 8555997052"
    default_shipping_paise: int = 7000
    free_shipping_threshold_paise: int = 99900
    tax_rate_percent: float = 18.0
    cod_enabled: bool = True
    cod_max_limit_paise: int = 2500000
    return_window_days: int = 7
    email_notifications_enabled: bool = True
    whatsapp_notifications_enabled: bool = True
    sms_notifications_enabled: bool = True
    promotional_banners: Optional[str] = None
