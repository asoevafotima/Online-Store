# 🛍️ Marketplace API

Полнофункциональный маркетплейс: бэкенд на **FastAPI** и фронтенд на **React + Vite + TypeScript**.
Продавцы создают магазины и товары, покупатели наполняют корзину и оформляют заказы, а встроенный
AI-ассистент (Groq) отвечает на вопросы о каталоге.

---

## ✨ Возможности

- 🔐 **Аутентификация** — регистрация/логин, JWT-токены, роли `user / seller / admin / superadmin`
- 🏬 **Магазины и товары** — каталог, варианты товаров (размер/цвет), категории, изображения
- 🔎 **Поиск и фильтры** — по названию, категории, магазину, цене; сортировка и пагинация
- 🛒 **Корзина и заказы** — добавление товаров, оформление, отслеживание статуса доставки
- 💳 **Платежи и баланс** — оплата заказов, история операций
- ⭐ **Отзывы** — на товары и на магазины, рейтинги
- ❤️ **Избранное** и 🏷️ **скидки/промокоды**
- 🔔 **Уведомления в реальном времени** — через WebSocket
- 💬 **Чат** покупателя с продавцом + 🤖 **AI-ассистент** на базе Groq (llama-3.3-70b)
- 📊 **Рекомендации** — персональные, популярные и похожие товары

---

## 🧱 Стек

| Слой        | Технологии |
|-------------|-----------|
| Backend     | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose (JWT), passlib/bcrypt, httpx |
| База данных | SQLite (по умолчанию; легко заменить на PostgreSQL через `DATABASE_URL`) |
| Frontend    | React 18, Vite, TypeScript, нативный fetch, тёмно-золотая тема «MARK·ET» |
| AI          | Groq API (OpenAI-совместимый эндпоинт) |

---

## 📁 Структура проекта

```
FastapiE/
├── main.py               # Точка входа FastAPI: CORS, подключение всех роутеров
├── config.py             # Централизованная конфигурация (читает .env)
├── database.py           # Engine, сессия, Base, get_db()
├── dependencies.py       # Зависимости авторизации (current_user / admin / seller)
├── requirements.txt      # Python-зависимости
├── .env.example          # Шаблон переменных окружения
├── alembic/              # Миграции БД
│
├── auth/                 # Регистрация, вход, выдача JWT
├── user/                 # Пользователи
├── store/                # Магазины
├── category/             # Категории
├── product/              # Товары, варианты, рекомендации
├── product_image/        # Изображения товаров
├── cart/  cart_item/     # Корзина
├── order/ order_item/    # Заказы
├── delivery/             # Доставка
├── payment/              # Платежи и баланс
├── review/ store_review/ # Отзывы на товары и магазины
├── favorite/             # Избранное
├── discount/             # Скидки и промокоды
├── notification/         # Уведомления + WebSocket-менеджер
├── chat/                 # Чат покупатель ↔ продавец
├── ai_chat/              # AI-ассистент (Groq)
│
└── frontend/             # React + Vite SPA
    └── src/
        ├── App.tsx       # Всё приложение (страницы, роутинг, состояние)
        └── index.css     # Тема и анимации
```

Каждый домен бэкенда — самодостаточный пакет по схеме **`model` → `schemas` → `crud` → `router`**
(vertical slice): модель SQLAlchemy, Pydantic-схемы, бизнес-логика и HTTP-эндпоинты.

---

## 🚀 Запуск

### 1. Переменные окружения

Скопируйте шаблон и заполните значения:

```bash
cp .env.example .env
```

| Переменная                    | Назначение                                   | По умолчанию |
|-------------------------------|----------------------------------------------|--------------|
| `SECRET_KEY`                  | Ключ подписи JWT (обязательно для продакшена) | случайный временный |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена                            | `30` |
| `DATABASE_URL`                | Строка подключения к БД                       | `sqlite:///./database.db` |
| `CORS_ORIGINS`                | Разрешённые origin'ы фронтенда (через запятую)| `http://localhost:5173,http://localhost:3000` |
| `GROQ_API_KEY`                | Ключ Groq для AI-ассистента                   | — |
| `GROQ_MODEL`                  | Модель Groq                                   | `llama-3.3-70b-versatile` |

> 🔑 Сгенерировать `SECRET_KEY`:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(48))"
> ```

### 2. Бэкенд

```bash
# Виртуальное окружение
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS

# Зависимости
pip install -r requirements.txt

# (опционально) применить миграции
alembic upgrade head

# Запуск API
uvicorn main:app --reload
```

API поднимется на **http://localhost:8000**.
Документация Swagger — **http://localhost:8000/docs**, ReDoc — **/redoc**.

### 3. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Сайт откроется на **http://localhost:5173**.

---

## 📚 Документация API

После запуска бэкенда доступны интерактивные доки:

- **Swagger UI** — http://localhost:8000/docs
- **ReDoc** — http://localhost:8000/redoc

Авторизация — через заголовок `Authorization: Bearer <token>`. Токен возвращается
эндпоинтами `/auth/register/` и `/auth/login/`.

---

## 🔒 Безопасность

- Все секреты вынесены в `.env` (он в `.gitignore` и **не коммитится**) — в репозитории только `.env.example`.
- `SECRET_KEY` и ключи внешних сервисов **никогда не хранятся в коде**.
- CORS настроен на конкретные origin'ы вместо `*`.

> ⚠️ Если ключ Groq когда-либо попадал в коммит или был засвечен — **отзовите его** в консоли Groq и выпустите новый.

---

## 📝 Заметки

- БД по умолчанию — SQLite (`database.db`), удобно для разработки. Для продакшена укажите PostgreSQL
  в `DATABASE_URL` (например, `postgresql+psycopg://user:pass@localhost/dbname`).
- Фронтенд — single-file SPA (`frontend/src/App.tsx`) с собственной тёмно-золотой темой и анимациями
  в `frontend/src/index.css`.
