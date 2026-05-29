from sqlalchemy.orm import Session
from order.model import Order
from order_item.model import OrderItem
from delivery.model import Delivery
from payment.model import Payment
from cart.model import Cart
from cart_item.model import CartItem
from notification.model import Notification
from notification import crud as notif_crud


async def _push(user_id: int, payload: dict):
    """Отправляет WS-уведомление если пользователь подключён."""
    from notification.ws_manager import notification_manager
    await notification_manager.send_to_user(user_id, payload)


def create_order(db: Session, user_id: int, address: str, city: str, payment_method: str, discount_code: str = None):
    import asyncio

    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise ValueError("Корзина не найдена")

    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not items:
        raise ValueError("Корзина пустая")

    for item in items:
        if item.quantity > item.product.stock:
            raise ValueError(f"Недостаточно товара «{item.product.name}» на складе")

    total = sum(item.product.price * item.quantity for item in items)

    discount = 0.0
    if discount_code:
        from discount.model import Discount
        from datetime import datetime
        disc = db.query(Discount).filter(
            Discount.code == discount_code,
            Discount.is_active == True
        ).first()
        if disc and (not disc.expires_at or disc.expires_at > datetime.utcnow()):
            discount = total * (disc.percent / 100)

    total = round(total - discount, 2)

    if payment_method == "balance":
        from user.model import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("Пользователь не найден")
        if user.balance < total:
            raise ValueError(f"Недостаточно средств. Нужно: {total:.2f}, есть: {user.balance:.2f}")
        user.balance -= total

    order = Order(user_id=user_id, total=total, status="pending")
    db.add(order)
    db.flush()

    store_items: dict[int, list] = {}  

    for item in items:
        store_id = item.product.store_id
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            store_id=store_id,
            quantity=item.quantity,
            price=item.product.price,
        )
        db.add(order_item)
        item.product.stock -= item.quantity

        if store_id not in store_items:
            store_items[store_id] = []
        store_items[store_id].append({
            "product": item.product.name,
            "quantity": item.quantity,
            "price": item.product.price,
        })

    if payment_method == "balance":
        from store.model import Store
        from user.model import User as UserModel
        for store_id, store_item_list in store_items.items():
            store = db.query(Store).filter(Store.id == store_id).first()
            if store:
                store_revenue = round(sum(i["price"] * i["quantity"] for i in store_item_list), 2)
                owner = db.query(UserModel).filter(UserModel.id == store.user_id).first()
                if owner:
                    owner.balance += store_revenue

    delivery = Delivery(order_id=order.id, address=address, city=city)
    db.add(delivery)

    payment_status = "paid" if payment_method == "balance" else "pending"
    payment = Payment(order_id=order.id, amount=total, method=payment_method, status=payment_status)
    db.add(payment)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)

    # Уведомление покупателю (БД)
    status_text = "оплачен" if payment_method == "balance" else "создан, ожидает оплаты"
    notif_crud.create_notification(db, user_id, f"Ваш заказ #{order.id} успешно {status_text}!")

    # WS push-уведомления владельцам магазинов
    from store.model import Store as StoreModel
    async def _send_store_notifications():
        for store_id, store_item_list in store_items.items():
            store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
            if store:
                items_text = ", ".join(
                    f"{i['product']} x{i['quantity']}" for i in store_item_list
                )
                store_revenue = round(sum(i["price"] * i["quantity"] for i in store_item_list), 2)

                # Сохраняем уведомление в БД для владельца магазина
                notif_crud.create_notification(
                    db, store.user_id,
                    f"Новый заказ #{order.id} в вашем магазине! Товары: {items_text}. Сумма: {store_revenue:.2f}"
                )
                # WS push
                await _push(store.user_id, {
                    "type": "new_order",
                    "order_id": order.id,
                    "status": "pending",
                    "items": store_item_list,
                    "revenue": store_revenue,
                    "message": f"Новый заказ #{order.id}! Товары: {items_text}",
                })

        # WS push покупателю
        await _push(user_id, {
            "type": "order_created",
            "order_id": order.id,
            "status": "pending",
            "total": total,
            "message": f"Ваш заказ #{order.id} успешно {status_text}!",
        })

    asyncio.create_task(_send_store_notifications())

    return order


def get_orders(db: Session):
    return db.query(Order).all()


def get_order(db: Session, order_id: int):
    return db.query(Order).filter(Order.id == order_id).first()


def get_user_orders(db: Session, user_id: int):
    return db.query(Order).filter(Order.user_id == user_id).all()


def get_store_orders(db: Session, store_id: int):
    """Все заказы, содержащие товары из конкретного магазина."""
    from order_item.model import OrderItem
    order_ids = db.query(OrderItem.order_id).filter(OrderItem.store_id == store_id).distinct()
    return db.query(Order).filter(Order.id.in_(order_ids)).all()


async def update_order_status(db: Session, order_id: int, status: str, actor_user_id: int = None):
    """
    Меняет статус заказа. При смене на 'доставлено' отправляет WS-уведомление покупателю.
    actor_user_id — тот, кто меняет статус (владелец магазина или админ).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = status
    db.commit()
    db.refresh(order)

    # Уведомление покупателю
    status_labels = {
        "pending": "ожидает обработки",
        "отправлен": "отправлен",
        "доставлено": "доставлен — вы можете оставить отзыв",
        "cancelled": "отменён",
    }
    label = status_labels.get(status, status)
    message = f"Статус вашего заказа #{order.id} изменён: {label}"

    notif_crud.create_notification(db, order.user_id, message)
    await _push(order.user_id, {
        "type": "order_status",
        "order_id": order.id,
        "status": status,
        "message": message,
    })

    return order


def cancel_order(db: Session, order_id: int, user_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    if order.user_id != user_id:
        raise ValueError("Нет доступа")
    if order.status != "pending":
        raise ValueError("Можно отменить только заказы со статусом pending")
    order.status = "cancelled"
    for item in order.items:
        item.product.stock += item.quantity
    db.commit()
    db.refresh(order)
    return order