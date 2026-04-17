from pydantic import BaseModel
from typing import List, Optional

class MatchResponse(BaseModel):
    id: int
    asset_id: int
    matched_image_url: str
    similarity_score: float
    is_violation: bool
