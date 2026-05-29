from pydantic import BaseModel
from datetime import datetime

class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    method: str

class PaymentRead(BaseModel):
    id: int
    order_id: int
    amount: float
    method: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class PaymentStatusUpdate(BaseModel):
    status: str