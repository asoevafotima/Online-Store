from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from collections import defaultdict
from typing import Optional


def get_similar_products(db: Session, product_id: int, limit: int = 8) -> list:
    from product.model import Product
    from order_item.model import OrderItem
    from order.model import Order
    from discount.model import Discount

    target = db.query(Product).filter(Product.id == product_id).first()
    if not target:
        return []

   
    co_bought_counts: dict = defaultdict(int)
    orders_with_target = (
        db.query(OrderItem.order_id)
        .filter(OrderItem.product_id == product_id)
        .subquery()
    )
    co_items = (
        db.query(OrderItem.product_id, func.count(OrderItem.id).label("cnt"))
        .filter(
            OrderItem.order_id.in_(orders_with_target),
            OrderItem.product_id != product_id,
        )
        .group_by(OrderItem.product_id)
        .all()
    )
    for row in co_items:
        co_bought_counts[row.product_id] = row.cnt

    now = datetime.utcnow()
    discounted_ids = set(
        r[0] for r in db.query(Discount.product_id).filter(
            Discount.is_active == True,
            Discount.product_id.isnot(None),
            (Discount.expires_at.is_(None)) | (Discount.expires_at > now),
        ).all()
        if r[0]
    )

    candidates = (
        db.query(Product)
        .filter(Product.id != product_id, Product.stock > 0)
        .all()
    )

    scored = []
    for p in candidates:
        score = 0.0
        if p.category_id == target.category_id:
            score += 3
        if p.store_id == target.store_id:
            score += 1
        score += min(co_bought_counts.get(p.id, 0) * 5, 15)  # cap at 15
        score += min(p.rating, 5) * 0.4  # 0..2
        if p.id in discounted_ids:
            score += 1
        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]


def get_recommendations_for_user(db: Session, user_id: int, limit: int = 12) -> list:
    from product.model import Product
    from order.model import Order
    from order_item.model import OrderItem
    from discount.model import Discount
    bought_items = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.user_id == user_id, Order.status.in_(["доставлено", "отправлен"]))
        .all()
    )
    bought_product_ids = {i.product_id for i in bought_items}

    category_counts: dict = defaultdict(int)
    store_counts: dict = defaultdict(int)
    for item in bought_items:
        if item.product:
            category_counts[item.product.category_id] += 1
            store_counts[item.product.store_id] += 1

    now = datetime.utcnow()
    discounted_ids = set(
        r[0] for r in db.query(Discount.product_id).filter(
            Discount.is_active == True,
            Discount.product_id.isnot(None),
            (Discount.expires_at.is_(None)) | (Discount.expires_at > now),
        ).all()
        if r[0]
    )

    candidates = (
        db.query(Product)
        .filter(Product.stock > 0, Product.id.notin_(bought_product_ids))
        .all()
    )

    scored = []
    for p in candidates:
        score = 0.0
        score += category_counts.get(p.category_id, 0) * 4
        score += store_counts.get(p.store_id, 0) * 2
        score += min(p.rating, 5) * 0.4
        if p.id in discounted_ids:
            score += 1
        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Если истории нет — добавляем популярные
    result = [p for _, p in scored if _ > 0]
    if len(result) < limit:
        popular = get_popular_products(db, limit=limit - len(result),
                                       exclude_ids={p.id for p in result} | bought_product_ids)
        result.extend(popular)

    return result[:limit]


def get_popular_products(db: Session, limit: int = 12, exclude_ids: Optional[set] = None) -> list:
    """
    Для анонимного пользователя: популярные + трендовые + со скидками.
    Трендовые = много продаж за последние 30 дней.
    """
    from product.model import Product
    from order_item.model import OrderItem
    from order.model import Order
    from discount.model import Discount
    from datetime import timedelta

    exclude_ids = exclude_ids or set()
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    # Продажи за последние 30 дней
    trending = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("sold"))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= month_ago)
        .group_by(OrderItem.product_id)
        .all()
    )
    trending_counts = {r.product_id: r.sold for r in trending}

    discounted_ids = set(
        r[0] for r in db.query(Discount.product_id).filter(
            Discount.is_active == True,
            Discount.product_id.isnot(None),
            (Discount.expires_at.is_(None)) | (Discount.expires_at > now),
        ).all()
        if r[0]
    )

    candidates = (
        db.query(Product)
        .filter(Product.stock > 0, Product.id.notin_(exclude_ids))
        .all()
    )

    scored = []
    for p in candidates:
        score = 0.0
        score += min(p.rating, 5) * 0.4
        score += min(trending_counts.get(p.id, 0), 50) * 0.1
        if p.id in discounted_ids:
            score += 1
        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]