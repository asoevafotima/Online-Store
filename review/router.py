from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from review import crud
from review.schemas import ReviewCreate, ReviewRead
from dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewRead)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return crud.create_review(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/product/{product_id}", response_model=list[ReviewRead])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    return crud.get_product_reviews(db, product_id)


@router.delete("/{review_id}", response_model=ReviewRead)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = crud.delete_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    return review