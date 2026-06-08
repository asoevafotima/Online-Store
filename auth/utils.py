from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt не принимает пароли длиннее 72 байт — обрезаем заранее.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return pwd_context.hash(password[:_BCRYPT_MAX_BYTES])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:_BCRYPT_MAX_BYTES], hashed)


def create_token(user_id: int, role: str, username: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
