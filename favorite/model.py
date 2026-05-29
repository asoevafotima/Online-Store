from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="unique_favorite"),
    )

    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")
    