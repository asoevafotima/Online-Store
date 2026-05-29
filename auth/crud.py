from sqlalchemy.orm import Session
from auth.schemas import RegisterSchema, LoginSchema
from auth.utils import hash_password, verify_password, create_token

def register(db: Session, data: RegisterSchema):
    from user.model import User
    from cart.model import Cart

    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise ValueError("Пользователь с таким username уже существует")

    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise ValueError("Пользователь с таким email уже существует")

    is_first = db.query(User).count() == 0
    role = "superadmin" if is_first else "user"

    user = User(
        username=data.username,
        password=hash_password(data.password),
        email=data.email,
        phone=data.phone,
        role=role
    )
    db.add(user)
    db.flush()

    cart = Cart(user_id=user.id)
    db.add(cart)
    db.commit()

    token = create_token(user.id, user.role, user.username)
    return {"access_token": token, "role": user.role}

def login(db: Session, data: LoginSchema):
    from user.model import User

    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise ValueError("Неверный username или пароль")
    if not verify_password(data.password, user.password):
        raise ValueError("Неверный username или пароль")
    if not user.is_active:
        raise ValueError("Аккаунт заблокирован")

    token = create_token(user.id, user.role, user.username)
    return {"access_token": token, "role": user.role}