from sqlalchemy.orm import Session
from user.model import User
from user.schemas import UserUpdate, UserRoleUpdate

def get_users(db: Session):
    return db.query(User).all()

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def update_user(db: Session, user_id: int, data: UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.username = data.username
    user.email = data.email
    user.phone = data.phone
    db.commit()
    db.refresh(user)
    return user

def update_user_role(db: Session, user_id: int, data: UserRoleUpdate, current_user):
    if data.role == "superadmin":
        raise ValueError("Нельзя назначить роль superadmin")
    if current_user.role != "superadmin":
        raise ValueError("Только superadmin может менять роли")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user

def deactivate_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    db.delete(user)
    db.commit()
    return user

def topup_balance(db: Session, user_id: int, amount: float):
    """Пополнить баланс пользователя — только админ."""
    import asyncio
    if amount <= 0:
        raise ValueError("Сумма пополнения должна быть больше нуля")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.balance += amount
    db.commit()
    db.refresh(user)

    from notification.crud import create_notification
    create_notification(db, user_id, f"Ваш баланс пополнен на {amount:.2f}. Текущий баланс: {user.balance:.2f}")

    async def _push():
        from notification.ws_manager import notification_manager
        await notification_manager.send_to_user(user_id, {
            "type": "balance_topup",
            "amount": amount,
            "balance": user.balance,
            "message": f"Баланс пополнен на {amount:.2f}. Текущий баланс: {user.balance:.2f}",
        })
    asyncio.create_task(_push())

    return user

def deduct_balance(db: Session, user_id: int, amount: float):
    """Списать с баланса — вызывается автоматически при оплате заказа."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Пользователь не найден")
    if user.balance < amount:
        raise ValueError("Недостаточно средств на балансе")
    user.balance -= amount
    db.commit()
    db.refresh(user)
    return user