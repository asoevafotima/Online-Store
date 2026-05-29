from pydantic import BaseModel
from datetime import datetime

class DiscountCreate(BaseModel):
    code: str
    percent: float
    expires_at: datetime = None

class DiscountRead(BaseModel):
    id: int
    store_id: int
    code: str
    percent: float
    is_active: bool
    expires_at: datetime = None

    model_config = {"from_attributes": True}
    