from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth import crud
from auth.schemas import RegisterSchema, LoginSchema, TokenSchema
from dependencies import security, get_current_superadmin

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register/", response_model=TokenSchema)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    try:
        return crud.register(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login/", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    try:
        return crud.login(db, data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/logout/")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    return {"detail": "Вы вышли из системы"}

@router.put("/users/{user_id}/make-admin/")
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_superadmin)
):
    from user.model import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Нельзя изменить роль superadmin")
    user.role = "admin"
    db.commit()
    return {"detail": f"{user.username} теперь admin"}

@router.put("/users/{user_id}/remove-admin/")
def remove_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_superadmin)
):
    from user.model import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Нельзя изменить роль superadmin")
    user.role = "user"
    db.commit()
    return {"detail": f"{user.username} теперь обычный пользователь"}