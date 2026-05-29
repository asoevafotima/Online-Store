from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    phone: str

class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    phone: str

class UserRead(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    role: str
    is_active: bool
    balance: float
    created_at: datetime

    model_config = {"from_attributes": True}

class UserRoleUpdate(BaseModel):
    role: str  

class BalanceTopUp(BaseModel):
    amount: float  # сумма пополнения