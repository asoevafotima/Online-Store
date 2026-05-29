from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from discount import crud
from discount.schemas import DiscountCreate, DiscountRead
from dependencies import get_current_user

router = APIRouter(prefix="/discounts", tags=["Discounts"])

@router.post("/", response_model=DiscountRead)
def create_discount(
    data: DiscountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store:
        raise HTTPException(status_code=404, detail="У вас нет магазина")
    return crud.create_discount(db, store.id, data)

@router.get("/store/{store_id}", response_model=list[DiscountRead])
def get_discounts(
    store_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_store_discounts(db, store_id)

@router.delete("/{discount_id}", response_model=DiscountRead)
def deactivate_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    discount = crud.deactivate_discount(db, discount_id)
    if not discount:
        raise HTTPException(status_code=404, detail="Скидка не найдена")
    return discount
