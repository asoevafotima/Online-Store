from sqlalchemy.orm import Session
from delivery.model import Delivery


def create_delivery(db: Session, order_id: int, address: str, city: str):
    existing = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if existing:
        raise ValueError("Доставка для этого заказа уже существует")
    delivery = Delivery(order_id=order_id, address=address, city=city)
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def get_delivery_by_order(db: Session, order_id: int):
    return db.query(Delivery).filter(Delivery.order_id == order_id).first()


def get_all_deliveries(db: Session):
    return db.query(Delivery).all()


def update_delivery_status(db: Session, delivery_id: int, status: str):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        return None
    delivery.status = status
    db.commit()
    db.refresh(delivery)
    return delivery
