from sqlalchemy.orm import Session
from discount.model import Discount
from discount.schemas import DiscountCreate

def create_discount(db: Session, store_id: int, data: DiscountCreate):
    discount = Discount(
        store_id=store_id,
        code=data.code,
        percent=data.percent,
        expires_at=data.expires_at
    )
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount

def get_store_discounts(db: Session, store_id: int):
    return db.query(Discount).filter(Discount.store_id == store_id).all()

def deactivate_discount(db: Session, discount_id: int):
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        return None
    discount.is_active = False
    db.commit()
    db.refresh(discount)
    return discount
