from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)  
    role = Column(String, nullable=False)                    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
