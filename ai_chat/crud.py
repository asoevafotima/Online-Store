import httpx
from sqlalchemy.orm import Session

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
import os
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


async def get_ai_response(db: Session, message: str) -> str:
    from product.model import Product
    from store.model import Store
    from category.model import Category

    products = db.query(Product).filter(Product.stock > 0).limit(30).all()
    products_info = "Доступные товары:\n" + "\n".join(
        [f"  - {p.name}: цена={p.price} руб., остаток={p.stock}" for p in products]
    )

    stores = db.query(Store).filter(Store.is_active == True).all()
    stores_info = "Магазины на платформе:\n" + "\n".join(
        [f"  - {s.name}: рейтинг={s.rating}" for s in stores]
    )

    categories = db.query(Category).all()
    categories_info = "Категории товаров: " + ", ".join([c.name for c in categories])

    system_prompt = f"""Ты — умный ассистент интернет-магазина.
Отвечай на вопросы покупателей на русском языке, коротко и по делу.
Используй данные из базы чтобы давать точные ответы о товарах, магазинах и категориях.

{products_info}

{stores_info}

{categories_info}
"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "max_tokens": 500,
                "temperature": 0.7,
            },
            timeout=30.0
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]