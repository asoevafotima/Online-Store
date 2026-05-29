from pydantic import BaseModel

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemRead(BaseModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    subtotal: float = 0.0

    model_config = {"from_attributes": True}
    