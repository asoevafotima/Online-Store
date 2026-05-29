from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from favorite import crud
from favorite.schemas import FavoriteAdd, FavoriteRead
from dependencies import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.post("/", response_model=FavoriteRead)
def add_favorite(
    data: FavoriteAdd,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return crud.add_favorite(db, current_user.id, data.product_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[FavoriteRead])
def get_favorites(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_favorites(db, current_user.id)

@router.delete("/{favorite_id}", response_model=FavoriteRead)
def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    favorite = crud.delete_favorite(db, favorite_id, current_user.id)
    if not favorite:
        raise HTTPException(status_code=404, detail="Не найдено в избранном")
    return favorite
