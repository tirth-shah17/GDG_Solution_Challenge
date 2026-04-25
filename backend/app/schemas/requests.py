from pydantic import BaseModel, HttpUrl
from uuid import UUID
from typing import Optional

class ScanRequest(BaseModel):
    media_id: UUID
    dataset_source: Optional[str] = None


class WebScraperRequest(BaseModel):
    media_id: UUID
    url: HttpUrl
    similarity_threshold: Optional[float] = 70.0  # Default 70% similarity threshold
