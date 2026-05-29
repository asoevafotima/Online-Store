from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from user.schemas import UserRead

class ProductShortRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

    model_config = {"from_attributes": True}

class StoreCreate(BaseModel):
    name: str
    description: str

class StoreUpdate(BaseModel):
    name: str
    description: str
    logo: Optional[str] = None

class StoreRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: str
    logo: Optional[str] = None
    rating: float
    is_active: bool
    created_at: datetime
    
    user: Optional[UserRead] = None
    products: List[ProductShortRead] = []

    model_config = {"from_attributes": True}

class StoreListRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: str
    logo: Optional[str] = None
    rating: float
    is_active: bool
    created_at: datetime
    
    user: Optional[UserRead] = None

    model_config = {"from_attributes": True}