from sqlalchemy.orm import Session
from cart_item.model import CartItem
from cart.model import Cart

def add_to_cart(db: Session, user_id: int, product_id: int, quantity: int):
    from product.model import Product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Товар не найден")
    if product.stock == 0:
        raise ValueError("Товар закончился")
    if quantity > product.stock:
        raise ValueError("Недостаточно товара на складе")
    if quantity < 1:
        raise ValueError("Количество не может быть меньше 1")

    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.flush()

    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()

    if existing:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return existing

    item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def update_cart_item(db: Session, item_id: int, quantity: int):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        return None
    if quantity < 1:
        raise ValueError("Количество не может быть меньше 1")
    if quantity > item.product.stock:
        raise ValueError("Недостаточно товара на складе")
    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item

def delete_cart_item(db: Session, item_id: int):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        return None
    db.delete(item)
    db.commit()
    return item
