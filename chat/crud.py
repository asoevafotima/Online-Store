from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from chat.model import ChatMessage


def save_message(db: Session, sender_id: int, receiver_id: int, store_id: int, message: str):
    msg = ChatMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        store_id=store_id,
        message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_messages(db: Session, sender_id: int, receiver_id: int, store_id: int):
    return db.query(ChatMessage).filter(
        ChatMessage.store_id == store_id,
        or_(
            and_(ChatMessage.sender_id == sender_id, ChatMessage.receiver_id == receiver_id),
            and_(ChatMessage.sender_id == receiver_id, ChatMessage.receiver_id == sender_id),
        )
    ).order_by(ChatMessage.created_at.asc()).all()


def get_user_chats(db: Session, user_id: int):
    """Получить список всех чатов пользователя (уникальные пары store_id + other_user_id)."""
    from user.model import User
    from store.model import Store

    # Все сообщения где пользователь — отправитель или получатель
    messages = db.query(ChatMessage).filter(
        or_(
            ChatMessage.sender_id == user_id,
            ChatMessage.receiver_id == user_id,
        )
    ).all()

    chats = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        key = (msg.store_id, other_id)
        if key not in chats or msg.created_at > chats[key]["last_message_at"]:
            chats[key] = {
                "store_id": msg.store_id,
                "other_user_id": other_id,
                "last_message": msg.message,
                "last_message_at": msg.created_at.isoformat(),
            }

    # Добавляем имена
    result = []
    for (store_id, other_id), chat_data in chats.items():
        other_user = db.query(User).filter(User.id == other_id).first()
        store = db.query(Store).filter(Store.id == store_id).first()
        chat_data["other_username"] = other_user.username if other_user else "Unknown"
        chat_data["store_name"] = store.name if store else "Unknown"
        result.append(chat_data)

    return result
