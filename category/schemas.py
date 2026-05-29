from pydantic import BaseModel
from typing import Optional


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None  


class CategoryUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

    model_config = {"from_attributes": True}