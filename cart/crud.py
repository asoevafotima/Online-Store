from sqlalchemy.orm import Session
from cart.model import Cart
from cart_item.model import CartItem

def get_cart(db: Session, user_id: int):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    total = sum(item.product.price * item.quantity for item in items)
    return {"id": cart.id, "user_id": user_id, "items": items, "total": total}

def clear_cart(db: Session, user_id: int):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
        