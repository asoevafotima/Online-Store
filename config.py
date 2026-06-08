"""Централизованная конфигурация приложения.

Все секреты и параметры окружения читаются здесь, в одном месте,
из переменных окружения (файл .env). Ничего чувствительного в коде.
"""
import os
import secrets

from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# --- Безопасность / JWT ---
SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

if not os.getenv("SECRET_KEY"):
    # Без явного ключа токены будут «протухать» при каждом перезапуске —
    # это сигнал прописать SECRET_KEY в .env для продакшена.
    import warnings

    warnings.warn(
        "SECRET_KEY не задан в окружении — сгенерирован временный ключ. "
        "Задайте SECRET_KEY в .env, иначе JWT-токены сбросятся при перезапуске.",
        stacklevel=2,
    )

# --- База данных ---
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# --- Внешние сервисы ---
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
GROQ_API_URL: str = os.getenv(
    "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"
)
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# --- CORS ---
# Список origin'ов через запятую, например:
# CORS_ORIGINS=http://localhost:5173,https://example.com
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
