from sqlalchemy.orm import Session
from favorite.model import Favorite

def add_favorite(db: Session, user_id: int, product_id: int):
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()
    if existing:
        raise ValueError("Товар уже в избранном")
    favorite = Favorite(user_id=user_id, product_id=product_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

def get_favorites(db: Session, user_id: int):
    return db.query(Favorite).filter(Favorite.user_id == user_id).all()

def delete_favorite(db: Session, favorite_id: int, user_id: int):
    favorite = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.user_id == user_id
    ).first()
    if not favorite:
        return None
    db.delete(favorite)
    db.commit()
    return favorite
