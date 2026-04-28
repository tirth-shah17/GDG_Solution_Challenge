from pydantic import BaseModel
from typing import List, Optional

class MatchResponse(BaseModel):
    id: int
    asset_id: int
    matched_image_url: str
    similarity_score: float
    is_violation: bool
    ai_explanation: Optional[str] = None


class ScrapedImageMatch(BaseModel):
    file_path: str
    similarity: float
    status: str  # "match" or "no_match"
    ai_explanation: Optional[str] = None


class WebScraperResponse(BaseModel):
    status: str
    strategy_used: str
    total_images_scraped: int
    matches_found: int
    similarity_threshold: float
    results: List[ScrapedImageMatch]
    message: str
