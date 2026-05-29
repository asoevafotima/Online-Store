from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from category.schemas import CategoryRead


# ========== Variant schemas ==========

class ProductVariantCreate(BaseModel):
    name: str
    variant_type: Optional[str] = None   # "color", "size", etc.
    value: Optional[str] = None          # "Красный", "M", etc.
    price: Optional[float] = None        # если None — цена товара
    stock: int = 0

    @field_validator("stock")
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock не может быть меньше 0")
        return v


class ProductVariantUpdate(BaseModel):
    name: Optional[str] = None
    variant_type: Optional[str] = None
    value: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None


class ProductVariantRead(BaseModel):
    id: int
    product_id: int
    name: str
    variant_type: Optional[str] = None
    value: Optional[str] = None
    price: Optional[float] = None
    stock: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ========== Product schemas ==========

class ProductShortRead(BaseModel):
    id: int
    store_id: int
    category_id: int
    name: str
    price: float
    stock: int
    rating: float

    model_config = {"from_attributes": True}

class ProductCreate(BaseModel):
    category_id: int
    name: str
    description: str
    price: float
    stock: int

    @field_validator("price")
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Цена должна быть больше 0")
        return v

    @field_validator("stock")
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock не может быть меньше 0")
        return v

class ProductUpdate(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    category_id: int

class ProductRead(BaseModel):
    id: int
    store_id: int
    category_id: int
    name: str
    description: str
    price: float
    stock: int
    rating: float
    category: CategoryRead
    created_at: datetime
    
    variants: List[ProductVariantRead] = []
    # Добавляем список похожих товаров (по умолчанию пустой)
    similar_products: List[ProductShortRead] = []

    model_config = {"from_attributes": True}