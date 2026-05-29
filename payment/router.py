from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
from payment import crud
from payment.schemas import PaymentRead, PaymentStatusUpdate
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/my/history", summary="История платежей покупателя")
def my_payment_history(
    date_from: Optional[datetime] = Query(None, description="Начало периода"),
    date_to: Optional[datetime] = Query(None, description="Конец периода"),
    operation_type: Optional[str] = Query(None, description="Тип: debit / credit"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_buyer_history(db, current_user.id, date_from, date_to, operation_type)



@router.get("/store/report", summary="Финансовый отчёт магазина")
def store_report(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from store.crud import get_store_by_user
    store = get_store_by_user(db, current_user.id)
    if not store:
        raise HTTPException(status_code=404, detail="У вас нет магазина")
    return crud.get_store_report(db, store.id, date_from, date_to)



@router.get("/by-order/{order_id}", response_model=PaymentRead)
def get_payment_by_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payment = crud.get_payment_by_order(db, order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    return payment


@router.get("/", response_model=list[PaymentRead])
def get_all_payments(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    return crud.get_all_payments(db)


@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    payment = crud.get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    return payment


@router.put("/{payment_id}/status/", response_model=PaymentRead)
def update_status(
    payment_id: int,
    data: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    payment = crud.update_payment_status(db, payment_id, data.status)
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    return payment