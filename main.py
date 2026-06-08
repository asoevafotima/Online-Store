from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from database import Base, engine

import user.model
import store.model
import category.model
import product.model
import product_image.model
import cart.model
import cart_item.model
import order.model
import order_item.model
import delivery.model
import payment.model
import review.model
import store_review.model
import favorite.model
import discount.model
import notification.model
import chat.model
import ai_chat.model

from auth.router import router as auth_router
from user.router import router as user_router
from store.router import router as store_router
from category.router import router as category_router
from product.router import router as product_router
from product_image.router import router as product_image_router
from cart.router import router as cart_router
from order.router import router as order_router
from review.router import router as review_router
from store_review.router import router as store_review_router
from favorite.router import router as favorite_router
from discount.router import router as discount_router
from notification.router import router as notification_router
from chat.router import router as chat_router
from delivery.router import router as delivery_router
from payment.router import router as payment_router
from ai_chat.router import router as ai_chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
  


app = FastAPI(
    title="Marketplace API", 
    version="1.0.0",
    lifespan=lifespan 
)

# Куки не используются (авторизация через Bearer-токен), поэтому при "*"
# отключаем credentials — иначе браузер отвергает такую комбинацию.
allow_credentials = CORS_ORIGINS != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(store_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(product_image_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(review_router)
app.include_router(store_review_router)
app.include_router(favorite_router)
app.include_router(discount_router)
app.include_router(notification_router)
app.include_router(chat_router)
app.include_router(delivery_router)
app.include_router(payment_router)
app.include_router(ai_chat_router)