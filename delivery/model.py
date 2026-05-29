from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    status = Column(String, default="pending")  
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="delivery")