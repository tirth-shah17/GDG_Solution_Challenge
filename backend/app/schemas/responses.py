from pydantic import BaseModel
from typing import List, Optional

class MatchResponse(BaseModel):
    id: int
    asset_id: int
    matched_image_url: str
    similarity_score: float
    is_violation: bool


class ScrapedImageMatch(BaseModel):
    file_path: str
    similarity: float
    status: str  # "match" or "no_match"


class WebScraperResponse(BaseModel):
    status: str
    strategy_used: str
    total_images_scraped: int
    matches_found: int
    similarity_threshold: float
    results: List[ScrapedImageMatch]
    message: str
