from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from cart import crud
from cart_item import crud as cart_item_crud
from cart_item.schemas import CartItemAdd, CartItemUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("/")
def get_cart(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_cart(db, current_user.id)

@router.post("/add/")
def add_to_cart(
    data: CartItemAdd,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return cart_item_crud.add_to_cart(db, current_user.id, data.product_id, data.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/items/{item_id}")
def update_item(
    item_id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        item = cart_item_crud.update_cart_item(db, item_id, data.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден в корзине")
    return item

@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    item = cart_item_crud.delete_cart_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден в корзине")
    return item

@router.delete("/clear/")
def clear_cart(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    crud.clear_cart(db, current_user.id)
    return {"detail": "Корзина очищена"}
    