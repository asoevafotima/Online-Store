from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from store import crud
from store.schemas import StoreCreate, StoreUpdate, StoreRead, StoreListRead
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.post("/", response_model=StoreRead)
def create_store(data: StoreCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        return crud.create_store(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[StoreListRead])
def get_stores(db: Session = Depends(get_db)):
    return crud.get_stores(db)

@router.get("/my", response_model=StoreRead)
def get_my_store(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    store = crud.get_store_by_user(db, current_user.id)
    if not store:
        raise HTTPException(status_code=404, detail="У вас нет магазина")
    return store

@router.get("/{store_id}", response_model=StoreRead)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = crud.get_store(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Магазин не найден")
    return store

@router.put("/{store_id}", response_model=StoreRead)
def update_store(
    store_id: int,
    data: StoreUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    store = crud.get_store(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Магазин не найден")
    if store.user_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.update_store(db, store_id, data)

@router.delete("/{store_id}", response_model=StoreRead)
def delete_store(store_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    store = crud.delete_store(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Магазин не найден")
    return store