from pydantic import BaseModel
from product.schemas import ProductRead

class FavoriteAdd(BaseModel):
    product_id: int

class FavoriteRead(BaseModel):
    id: int
    user_id: int
    product_id: int
    product: ProductRead

    model_config = {"from_attributes": True}
    