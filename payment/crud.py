from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime
from payment.model import Payment
from order.model import Order
from order_item.model import OrderItem


def create_payment(db: Session, order_id: int, amount: float, method: str):
    payment = Payment(order_id=order_id, amount=amount, method=method, status="pending")
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment(db: Session, payment_id: int):
    return db.query(Payment).filter(Payment.id == payment_id).first()


def get_payment_by_order(db: Session, order_id: int):
    return db.query(Payment).filter(Payment.order_id == order_id).first()


def get_all_payments(db: Session):
    return db.query(Payment).all()


def update_payment_status(db: Session, payment_id: int, status: str):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None
    payment.status = status
    db.commit()
    db.refresh(payment)
    return payment



def get_buyer_history(
    db: Session,
    user_id: int,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    operation_type: Optional[str] = None,  
):
    """
    История финансовых операций покупателя.
    debit  — списания за заказы
    credit — пополнения баланса администратором (из таблицы notifications как маркер)
    """
    query = (
        db.query(Payment)
        .join(Order, Order.id == Payment.order_id)
        .filter(Order.user_id == user_id)
    )

    if date_from:
        query = query.filter(Payment.created_at >= date_from)
    if date_to:
        query = query.filter(Payment.created_at <= date_to)
    if operation_type == "debit":
        query = query.filter(Payment.status == "paid")
    elif operation_type == "credit":
        return {
            "operations": [],
            "total_spent": 0,
            "current_balance": _get_balance(db, user_id),
        }

    payments = query.order_by(desc(Payment.created_at)).all()
    total_spent = sum(p.amount for p in payments if p.status == "paid")

    return {
        "operations": [
            {
                "id": p.id,
                "order_id": p.order_id,
                "amount": p.amount,
                "method": p.method,
                "status": p.status,
                "type": "debit",
                "description": f"Оплата заказа #{p.order_id}",
                "date": p.created_at.isoformat(),
            }
            for p in payments
        ],
        "total_spent": round(total_spent, 2),
        "current_balance": _get_balance(db, user_id),
    }


def _get_balance(db: Session, user_id: int) -> float:
    from user.model import User
    user = db.query(User).filter(User.id == user_id).first()
    return user.balance if user else 0.0



def get_store_report(
    db: Session,
    store_id: int,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """
    Финансовый отчёт магазина:
    - все поступления (order_items из этого магазина по оплаченным заказам)
    - общий доход и доход за период
    - топ-5 товаров по выручке
    - динамика продаж по месяцам
    """
    from product.model import Product

   
    base = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Payment, Payment.order_id == Order.id)
        .filter(
            OrderItem.store_id == store_id,
            Payment.status == "paid",
        )
    )

    all_items = base.all()
    total_revenue = round(sum(i.price * i.quantity for i in all_items), 2)

    period_query = base
    if date_from:
        period_query = period_query.filter(Order.created_at >= date_from)
    if date_to:
        period_query = period_query.filter(Order.created_at <= date_to)
    period_items = period_query.all()
    period_revenue = round(sum(i.price * i.quantity for i in period_items), 2)

    incomes = []
    for item in period_items:
        order = db.query(Order).filter(Order.id == item.order_id).first()
        incomes.append({
            "order_id": item.order_id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else "—",
            "quantity": item.quantity,
            "unit_price": item.price,
            "subtotal": round(item.price * item.quantity, 2),
            "date": order.created_at.isoformat() if order else None,
        })

    from collections import defaultdict
    product_revenue: dict = defaultdict(lambda: {"revenue": 0.0, "sold": 0, "name": ""})
    for item in all_items:
        pid = item.product_id
        product_revenue[pid]["revenue"] += item.price * item.quantity
        product_revenue[pid]["sold"] += item.quantity
        if item.product:
            product_revenue[pid]["name"] = item.product.name

    top_products = sorted(
        [{"product_id": pid, **v} for pid, v in product_revenue.items()],
        key=lambda x: x["revenue"],
        reverse=True,
    )[:5]
    for p in top_products:
        p["revenue"] = round(p["revenue"], 2)

    monthly: dict = defaultdict(float)
    for item in all_items:
        order = db.query(Order).filter(Order.id == item.order_id).first()
        if order:
            key = order.created_at.strftime("%Y-%m")
            monthly[key] += item.price * item.quantity
    sales_dynamics = [
        {"month": k, "revenue": round(v, 2)}
        for k, v in sorted(monthly.items())
    ]

    return {
        "store_id": store_id,
        "total_revenue": total_revenue,
        "period_revenue": period_revenue,
        "period_from": date_from.isoformat() if date_from else None,
        "period_to": date_to.isoformat() if date_to else None,
        "incomes": incomes,
        "top_products": top_products,
        "sales_dynamics": sales_dynamics,
    }