from pydantic import BaseModel
from datetime import datetime

class DeliveryRead(BaseModel):
    id: int
    order_id: int
    address: str
    city: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class DeliveryStatusUpdate(BaseModel):
    status: str
    