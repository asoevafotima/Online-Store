from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from category import crud
from category.schemas import CategoryCreate, CategoryUpdate, CategoryRead
from dependencies import get_current_admin

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryRead])
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)

@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return category

@router.post("/", response_model=CategoryRead)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    return crud.create_category(db, data)

@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    category = crud.update_category(db, category_id, data)
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return category

@router.delete("/{category_id}", response_model=CategoryRead)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    category = crud.delete_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return category
