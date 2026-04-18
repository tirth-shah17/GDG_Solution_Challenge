import os
import uuid
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import MediaAsset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_asset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type
    if not file.content_type.startswith("image/") and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images and videos are allowed.")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file and calculate hash in chunks to prevent memory overhead
    file_hash = hashlib.sha256()
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                file_hash.update(chunk)
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
            
    asset_hash = file_hash.hexdigest()

    # Store in Neon DB
    db_asset = MediaAsset(
        file_path=file_path,
        hash=asset_hash
    )
    
    try:
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
    except Exception as e:
        db.rollback()
        # Clean up the leftover file if DB fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Database error occurred.")
    
    return {
        "status": "success",
        "message": "Asset uploaded and recorded securely",
        "filename": file.filename,
        "asset_id": str(db_asset.id),
        "hash": asset_hash
    }
