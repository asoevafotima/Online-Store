from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    balance = Column(Float, default=0.0, nullable=False)  # ← баланс
    created_at = Column(DateTime, server_default=func.now())

    store = relationship("Store", back_populates="user", uselist=False)
    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    store_reviews = relationship("StoreReview", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    notifications = relationship("Notification", back_populates="user")