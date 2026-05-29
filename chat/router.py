from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from chat import crud
from chat.schemas import ChatMessageCreate, ChatMessageRead
from auth.utils import decode_token
from dependencies import get_current_user

router = APIRouter(tags=["Chat"])

active_connections: dict = {}


# ========== REST-эндпоинты (работают в Swagger) ==========

@router.post("/chat/send", response_model=ChatMessageRead, summary="Отправить сообщение в чат")
def send_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Отправить сообщение в чат с магазином (REST)."""
    msg = crud.save_message(db, current_user.id, data.receiver_id, data.store_id, data.message)

    # Пытаемся отправить через WebSocket если получатель подключён
    room = f"{data.store_id}_{min(current_user.id, data.receiver_id)}_{max(current_user.id, data.receiver_id)}"
    if room in active_connections:
        import asyncio
        for connection in active_connections[room]:
            try:
                asyncio.create_task(connection.send_text(f"{current_user.id}: {data.message}"))
            except Exception:
                pass

    return msg


@router.get("/chat/history/{store_id}/{other_user_id}", response_model=list[ChatMessageRead], summary="История чата")
def get_chat_history(
    store_id: int,
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Получить историю сообщений между текущим пользователем и другим пользователем в рамках магазина."""
    return crud.get_messages(db, current_user.id, other_user_id, store_id)


@router.get("/chat/my-chats", response_model=list[dict], summary="Мои чаты")
def get_my_chats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Список всех чатов текущего пользователя."""
    return crud.get_user_chats(db, current_user.id)


# ========== WebSocket-эндпоинт (realtime) ==========

@router.websocket("/ws/chat/{store_id}/{receiver_id}")
async def chat(
    websocket: WebSocket,
    store_id: int,
    receiver_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return

    sender_id = payload["user_id"]

    await websocket.accept()
    room = f"{store_id}_{min(sender_id, receiver_id)}_{max(sender_id, receiver_id)}"

    if room not in active_connections:
        active_connections[room] = []
    active_connections[room].append(websocket)

    history = crud.get_messages(db, sender_id, receiver_id, store_id)
    for msg in history:
        await websocket.send_text(f"{msg.sender_id}: {msg.message}")

    try:
        while True:
            data = await websocket.receive_text()
            crud.save_message(db, sender_id, receiver_id, store_id, data)
            for connection in active_connections[room]:
                await connection.send_text(f"{sender_id}: {data}")
    except WebSocketDisconnect:
        active_connections[room].remove(websocket)