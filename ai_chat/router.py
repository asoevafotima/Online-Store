from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from ai_chat import crud
from ai_chat.schemas import AIRequest, AIResponse

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post("/chat/", response_model=AIResponse)
async def chat_with_ai(
    data: AIRequest,
    db: Session = Depends(get_db),
):
    reply = await crud.get_ai_response(db, message=data.message)
    return AIResponse(reply=reply)