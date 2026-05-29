from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from order import crud
from order.schemas import OrderCreate, OrderStatusUpdate, OrderRead
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderRead)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return crud.create_order(
            db, current_user.id,
            data.address, data.city,
            data.payment_method,
            data.discount_code,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[OrderRead])
def get_orders(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    return crud.get_orders(db)


@router.get("/my", response_model=list[OrderRead])
def get_my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_user_orders(db, current_user.id)


@router.get("/store", response_model=list[OrderRead])
def get_store_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Заказы, содержащие товары из магазина текущего пользователя."""
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store:
        raise HTTPException(status_code=404, detail="У вас нет магазина")
    return crud.get_store_orders(db, store.id)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order.user_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return order


@router.put("/{order_id}/status/", response_model=OrderRead)
async def update_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Смена статуса заказа.
    Разрешено: владелец магазина (если заказ содержит его товары) или администратор.
    Жизненный цикл: pending → отправлен → доставлено
    """
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    is_admin = current_user.role in ["admin", "superadmin"]
    if not is_admin:
        from store.crud import get_store_by_user
        store = get_store_by_user(db, current_user.id)
        if not store:
            raise HTTPException(status_code=403, detail="У вас нет магазина")
        store_ids_in_order = {item.store_id for item in order.items}
        if store.id not in store_ids_in_order:
            raise HTTPException(status_code=403, detail="Этот заказ не относится к вашему магазину")

    valid_transitions = {
        "pending": ["отправлен", "cancelled"],
        "отправлен": ["доставлено"],
        "доставлено": [],
        "cancelled": [],
    }
    allowed = valid_transitions.get(order.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя перевести статус из «{order.status}» в «{data.status}». Допустимо: {allowed}"
        )

    order = await crud.update_order_status(db, order_id, data.status, current_user.id)
    return order


@router.delete("/{order_id}/cancel/", response_model=OrderRead)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        order = crud.cancel_order(db, order_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order