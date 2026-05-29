from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from notification import crud
from notification.schemas import NotificationRead, NotificationCreate
from notification.ws_manager import notification_manager
from dependencies import get_current_user, get_current_admin
from auth.utils import decode_token

router = APIRouter(prefix="/notifications", tags=["Notifications"])



@router.websocket("/ws/notifications")
async def notifications_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Подключается пользователь по JWT-токену.
    После подключения получает push-уведомления в реальном времени:
      - покупатель: смена статуса заказа, пополнение баланса
      - владелец магазина: новый заказ с перечнем товаров
    Также отдаёт непрочитанные уведомления из БД сразу при подключении.
    """
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return

    user_id = payload["user_id"]
    await notification_manager.connect(user_id, websocket)
    unread = crud.get_unread_notifications(db, user_id)
    for notif in unread:
        await websocket.send_json({
            "type": "notification",
            "id": notif.id,
            "message": notif.message,
            "created_at": notif.created_at.isoformat(),
        })

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("action") == "mark_read":
                crud.mark_as_read(db, data["id"], user_id)
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)


@router.post("/", response_model=NotificationRead)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return crud.create_notification(db, data.user_id, data.message)


@router.get("/", response_model=list[NotificationRead])
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.get_notifications(db, current_user.id)


@router.put("/{notification_id}/read/", response_model=NotificationRead)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif = crud.mark_as_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    return notif