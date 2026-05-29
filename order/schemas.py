from pydantic import BaseModel
from datetime import datetime

class OrderCreate(BaseModel):
    address: str
    city: str
    payment_method: str  
    discount_code: str = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderItemRead(BaseModel):
    id: int
    product_id: int
    store_id: int
    quantity: int
    price: float

    model_config = {"from_attributes": True}

class OrderRead(BaseModel):
    id: int
    user_id: int
    total: float
    status: str
    created_at: datetime
    items: list[OrderItemRead] = []

    model_config = {"from_attributes": True}
