import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import generate_explanation

logger = logging.getLogger(__name__)

router = APIRouter()

class InsightRequest(BaseModel):
    similarity: float

class InsightResponse(BaseModel):
    ai_explanation: str

@router.post("/generate", response_model=InsightResponse)
async def generate_insight(request: InsightRequest):
    """
    Generate an AI insight based on the similarity score.
    """
    try:
        explanation = generate_explanation(request.similarity)
        return InsightResponse(ai_explanation=explanation)
    except Exception as e:
        logger.error(f"Error generating insight: {e}")
        raise HTTPException(status_code=500, detail=str(e))
