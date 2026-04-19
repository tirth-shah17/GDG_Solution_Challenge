from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.dataset_indexer import index_dataset
from app.services.matching import find_similar_images
from app.schemas.requests import ScanRequest

router = APIRouter()

@router.post("/")
async def start_scan(request: ScanRequest, db: Session = Depends(get_db)):
    """
    Trigger media scan to find similarities against dataset.
    """
    try:
        results = find_similar_images(request.media_id, db)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index-dataset")
async def trigger_index_dataset(db: Session = Depends(get_db)):
    """
    Temporary route to trigger dataset indexing.
    Reads images from backend/dataset and hashes them into DB.
    """
    result = index_dataset(db)
    return result
