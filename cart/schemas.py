from pydantic import BaseModel
from cart_item.schemas import CartItemRead

class CartRead(BaseModel):
    id: int
    user_id: int
    items: list[CartItemRead] = []
    total: float = 0.0

    model_config = {"from_attributes": True}
    