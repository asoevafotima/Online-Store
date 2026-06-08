import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from config import GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL


def _build_system_prompt(db: Session) -> str:
    from category.model import Category
    from product.model import Product
    from store.model import Store

    products = db.query(Product).filter(Product.stock > 0).limit(30).all()
    products_info = "Доступные товары:\n" + "\n".join(
        f"  - {p.name}: цена={p.price} руб., остаток={p.stock}" for p in products
    )

    stores = db.query(Store).filter(Store.is_active.is_(True)).all()
    stores_info = "Магазины на платформе:\n" + "\n".join(
        f"  - {s.name}: рейтинг={s.rating}" for s in stores
    )

    categories = db.query(Category).all()
    categories_info = "Категории товаров: " + ", ".join(c.name for c in categories)

    return f"""Ты — умный ассистент интернет-магазина.
Отвечай на вопросы покупателей на русском языке, коротко и по делу.
Используй данные из базы чтобы давать точные ответы о товарах, магазинах и категориях.

{products_info}

{stores_info}

{categories_info}
"""


async def get_ai_response(db: Session, message: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI-ассистент не настроен: задайте GROQ_API_KEY в .env",
        )

    system_prompt = _build_system_prompt(db)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Ошибка обращения к AI-сервису: {exc}"
        ) from exc

    return data["choices"][0]["message"]["content"]
