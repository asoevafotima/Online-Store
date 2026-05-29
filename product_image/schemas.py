from pydantic import BaseModel

class ProductImageCreate(BaseModel):
    product_id: int
    image_url: str

class ProductImageRead(BaseModel):
    id: int
    product_id: int
    image_url: str

    model_config = {"from_attributes": True}
    