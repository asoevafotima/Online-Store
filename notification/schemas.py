from pydantic import BaseModel
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: int
    message: str

class NotificationRead(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}