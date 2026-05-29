from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from user import crud
from user.schemas import UserRead, UserUpdate, UserRoleUpdate, BalanceTopUp
from dependencies import get_current_user, get_current_admin, get_current_superadmin

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=list[UserRead])
def get_users(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    return crud.get_users(db)

@router.get("/me", response_model=UserRead)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.put("/me", response_model=UserRead)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.update_user(db, current_user.id, data)

@router.put("/{user_id}/role", response_model=UserRead)
def update_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_superadmin)
):
    try:
        user = crud.update_user_role(db, user_id, data, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.post("/{user_id}/topup", response_model=UserRead)
def topup_balance(
    user_id: int,
    data: BalanceTopUp,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)  
):
    """Пополнить баланс пользователя."""
    try:
        user = crud.topup_balance(db, user_id, data.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.delete("/{user_id}", response_model=UserRead)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_superadmin)):
    user = crud.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user