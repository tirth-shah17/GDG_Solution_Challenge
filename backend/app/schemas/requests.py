from pydantic import BaseModel

class ScanRequest(BaseModel):
    dataset_source: str | None = None
