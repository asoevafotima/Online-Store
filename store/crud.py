from sqlalchemy.orm import Session, joinedload
from store.model import Store
from store.schemas import StoreCreate, StoreUpdate

def create_store(db: Session, data: StoreCreate, user_id: int):
    existing = db.query(Store).filter(Store.user_id == user_id).first()
    if existing:
        raise ValueError("У вас уже есть магазин")
    store = Store(
        user_id=user_id,
        name=data.name,
        description=data.description
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

def get_stores(db: Session):
    return db.query(Store).options(joinedload(Store.products), joinedload(Store.user)).filter(Store.is_active == True).all()

def get_store(db: Session, store_id: int):
    return db.query(Store).options(joinedload(Store.products), joinedload(Store.user)).filter(Store.id == store_id).first()

def get_store_by_user(db: Session, user_id: int):
    return db.query(Store).options(joinedload(Store.products), joinedload(Store.user)).filter(Store.user_id == user_id).first()

def update_store(db: Session, store_id: int, data: StoreUpdate):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        return None
    store.name = data.name
    store.description = data.description
    store.logo = data.logo
    db.commit()
    db.refresh(store)
    return store

def delete_store(db: Session, store_id: int):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        return None
    db.delete(store)
    db.commit()
    return store