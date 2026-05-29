from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ChatMessageCreate(BaseModel):
    receiver_id: int
    store_id: int
    message: str


class ChatMessageRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    store_id: int
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
