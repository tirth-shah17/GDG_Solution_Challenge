from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ScanRequest(BaseModel):
    media_id: UUID
    dataset_source: Optional[str] = None
