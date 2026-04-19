import os
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.services.hashing import generate_perceptual_hash
from app.models.domain import ScannedContent

# Configure basic logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the dataset folder relative to backend run root
DATASET_DIR = Path("dataset")

def index_dataset(db: Session) -> dict:
    """
    Scans the dataset directory, generates hashes for images,
    and stores them in the scanned_content table.
    """
    logger.info("Starting dataset indexing...")
    
    if not DATASET_DIR.exists() or not DATASET_DIR.is_dir():
        logger.error(f"Dataset directory not found: {DATASET_DIR.absolute()}")
        return {"error": "Dataset directory not found"}

    supported_extensions = {".jpg", ".jpeg", ".png"}
    total_processed = 0
    inserted = 0
    skipped = 0

    for file_path in DATASET_DIR.rglob("*"):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            total_processed += 1
            try:
                # Generate hash using existing hashing service
                file_hash = generate_perceptual_hash(str(file_path))
                
                # Check if hash already exists in scanned_content
                existing = db.query(ScannedContent).filter(ScannedContent.hash == file_hash).first()
                if existing:
                    skipped += 1
                    logger.debug(f"Skipped {file_path.name}: Hash already exists (ID: {existing.id}).")
                else:
                    # Insert new record into DB
                    new_record = ScannedContent(
                        file_path=str(file_path.as_posix()), # Store standard forward slashes
                        hash=file_hash,
                        source="dataset"
                    )
                    db.add(new_record)
                    inserted += 1
                    logger.debug(f"Inserted {file_path.name} with hash {file_hash}.")

            except Exception as e:
                logger.error(f"Error processing {file_path.name}: {e}")
                skipped += 1

    try:
        db.commit()
    except Exception as e:
        logger.error(f"Database commit error: {e}")
        db.rollback()
        return {"error": "Database commit failed"}

    logger.info(f"Dataset indexing complete. Total: {total_processed}, Inserted: {inserted}, Skipped: {skipped}")
    
    return {
        "message": "Dataset indexed successfully",
        "total_processed": total_processed,
        "inserted": inserted,
        "skipped": skipped
    }
