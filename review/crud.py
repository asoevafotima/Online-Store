from sqlalchemy.orm import Session
from sqlalchemy import func
from review.model import Review
from review.schemas import ReviewCreate


def create_review(db: Session, user_id: int, data: ReviewCreate):
    from product.model import Product
    from order.model import Order
    from order_item.model import OrderItem

    delivered_order = (
        db.query(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .filter(
            Order.user_id == user_id,
            Order.status == "доставлено",
            OrderItem.product_id == data.product_id,
        )
        .first()
    )
    if not delivered_order:
        raise ValueError("Оставить отзыв можно только после получения заказа с этим товаром")

    existing = db.query(Review).filter(
        Review.user_id == user_id,
        Review.product_id == data.product_id,
    ).first()
    if existing:
        raise ValueError("Вы уже оставили отзыв на этот товар")

    review = Review(
        user_id=user_id,
        product_id=data.product_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.flush()

    avg = db.query(func.avg(Review.rating)).filter(Review.product_id == data.product_id).scalar()
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product:
        product.rating = round(float(avg), 2)

    db.commit()
    db.refresh(review)
    return review


def get_product_reviews(db: Session, product_id: int):
    return db.query(Review).filter(Review.product_id == product_id).all()


def delete_review(db: Session, review_id: int):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        return None
    db.delete(review)
    db.commit()
    return review