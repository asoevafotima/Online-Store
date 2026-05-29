from sqlalchemy.orm import Session
from sqlalchemy import func
from store_review.model import StoreReview
from store_review.schemas import StoreReviewCreate

def create_store_review(db: Session, user_id: int, data: StoreReviewCreate):
    from store.model import Store
    review = StoreReview(
        user_id=user_id,
        store_id=data.store_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.flush()

    avg = db.query(func.avg(StoreReview.rating)).filter(
        StoreReview.store_id == data.store_id
    ).scalar()
    store = db.query(Store).filter(Store.id == data.store_id).first()
    if store:
        store.rating = round(avg, 2)

    db.commit()
    db.refresh(review)
    return review

def get_store_reviews(db: Session, store_id: int):
    return db.query(StoreReview).filter(StoreReview.store_id == store_id).all()

def delete_store_review(db: Session, review_id: int):
    review = db.query(StoreReview).filter(StoreReview.id == review_id).first()
    if not review:
        return None
    db.delete(review)
    db.commit()
    return review
