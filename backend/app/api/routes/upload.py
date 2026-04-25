import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.logger import logger
from app.db.database import get_db
from app.models.domain import MediaAsset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_asset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type
    if not file.content_type or (
        not file.content_type.startswith("image/")
        and not file.content_type.startswith("video/")
    ):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images and videos are allowed.")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    from app.services.hashing import generate_perceptual_hash

    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
    except Exception as e:
        logger.exception("Failed to save uploaded file '%s'.", file.filename)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
            
    try:
        asset_hash = generate_perceptual_hash(file_path)
    except Exception:
        logger.warning("Perceptual hash generation failed for '%s'. Falling back to default hash.", file.filename)
        # If it's a video or unrecognized format, phash might fail, fallback to a dummy hash or raise
        asset_hash = "0000000000000000"

    # Reuse an existing asset for duplicate uploads so the same image can be uploaded repeatedly
    existing_asset = db.query(MediaAsset).filter(MediaAsset.hash == asset_hash).first()
    if existing_asset:
        logger.info(
            "Duplicate upload detected for '%s'. Reusing existing asset %s.",
            file.filename,
            existing_asset.id,
        )
        if os.path.exists(file_path):
            os.remove(file_path)
        return {
            "status": "success",
            "message": "Asset already exists. Reusing the existing record.",
            "filename": file.filename,
            "asset_id": str(existing_asset.id),
            "hash": asset_hash
        }

    # Store in Neon DB
    db_asset = MediaAsset(
        file_path=file_path,
        hash=asset_hash
    )
    
    try:
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
    except IntegrityError:
        db.rollback()
        logger.warning(
            "Integrity conflict while saving '%s'. Attempting to reuse an existing asset by hash.",
            file.filename,
        )
        existing_asset = db.query(MediaAsset).filter(MediaAsset.hash == asset_hash).first()
        if os.path.exists(file_path):
            os.remove(file_path)
        if existing_asset:
            return {
                "status": "success",
                "message": "Asset already exists. Reusing the existing record.",
                "filename": file.filename,
                "asset_id": str(existing_asset.id),
                "hash": asset_hash
            }
        raise HTTPException(
            status_code=500,
            detail="Database conflict occurred while saving the uploaded asset.",
        )
    except Exception:
        db.rollback()
        logger.exception("Database commit failed while saving uploaded asset '%s'.", file.filename)
        # Clean up the leftover file if DB fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail="Database error occurred while saving the uploaded asset. Check backend logs for the exact cause.",
        )
    
    return {
        "status": "success",
        "message": "Asset uploaded and recorded securely",
        "filename": file.filename,
        "asset_id": str(db_asset.id),
        "hash": asset_hash
    }
