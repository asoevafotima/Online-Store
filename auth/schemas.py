from pydantic import BaseModel, EmailStr

class RegisterSchema(BaseModel):
    username: str
    password: str
    email: EmailStr
    phone: str

class LoginSchema(BaseModel):
    username: str
    password: str

class TokenSchema(BaseModel):
    access_token: str
    role: str