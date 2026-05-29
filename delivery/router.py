from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from delivery import crud
from delivery.schemas import DeliveryRead, DeliveryStatusUpdate
from dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

@router.get("/by-order/{order_id}", response_model=DeliveryRead)
def get_delivery_by_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    delivery = crud.get_delivery_by_order(db, order_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Доставка не найдена")
    return delivery

@router.get("/", response_model=list[DeliveryRead])
def get_all_deliveries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    return crud.get_all_deliveries(db)

@router.put("/{delivery_id}/status/", response_model=DeliveryRead)
def update_delivery_status(
    delivery_id: int,
    data: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    delivery = crud.update_delivery_status(db, delivery_id, data.status)
    if not delivery:
        raise HTTPException(status_code=404, detail="Доставка не найдена")
    return delivery