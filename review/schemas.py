from pydantic import BaseModel, field_validator
from datetime import datetime

class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    comment: str

    @field_validator("rating")
    def rating_must_be_valid(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Рейтинг должен быть от 1 до 5")
        return v

class ReviewRead(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}
    