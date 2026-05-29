from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from store_review import crud
from store_review.schemas import StoreReviewCreate, StoreReviewRead
from dependencies import get_current_user

router = APIRouter(prefix="/store-reviews", tags=["Store Reviews"])

@router.post("/", response_model=StoreReviewRead)
def create_review(
    data: StoreReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_store_review(db, current_user.id, data)

@router.get("/store/{store_id}", response_model=list[StoreReviewRead])
def get_reviews(store_id: int, db: Session = Depends(get_db)):
    return crud.get_store_reviews(db, store_id)

@router.delete("/{review_id}", response_model=StoreReviewRead)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    review = crud.delete_store_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    return review
