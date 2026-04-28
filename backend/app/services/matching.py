import logging
from uuid import UUID
import imagehash
from sqlalchemy.orm import Session
from app.models.domain import MediaAsset, ScannedContent, Match

logger = logging.getLogger(__name__)

def calculate_hamming_distance(hash1_str: str, hash2_str: str) -> int:
    """Calculate the Hamming distance between two image hashes."""
    hash1 = imagehash.hex_to_hash(hash1_str)
    hash2 = imagehash.hex_to_hash(hash2_str)
    return hash1 - hash2

def find_similar_images(media_id: UUID, db: Session) -> list:
    """
    Compares uploaded media with dataset images and detects similarity.
    """
    if not media_id:
        return []

    # Fetch uploaded image hash
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        logger.error(f"MediaAsset with ID {media_id} not found.")
        return []

    # Fetch all dataset hashes
    dataset_items = db.query(ScannedContent).all()
    if not dataset_items:
        logger.warning("No dataset images found in scanned_content.")
        return []

    matches_found = []
    # phash from imagehash creates 64-bit hash (8x8)
    hash_length = 64  

    for item in dataset_items:
        try:
            distance = calculate_hamming_distance(media.hash, item.hash)
            similarity = (1 - (distance / hash_length)) * 100
            
            # Use 70% threshold
            if similarity > 70.0:
                match_info = {
                    "file_path": item.file_path,
                    "similarity": round(similarity, 2),
                    "status": "violation",
                    "ai_explanation": None
                }
                matches_found.append(match_info)
                
                # Insert match into the matches table
                new_match = Match(
                    media_id=media.id,
                    scanned_id=item.id,
                    similarity=round(similarity, 2),
                    status="violation"
                )
                db.add(new_match)
                
        except Exception as e:
            logger.error(f"Error computing distance for {item.id}: {e}")

    if matches_found:
        try:
            db.commit()
        except Exception as e:
            logger.error(f"Match DB commit error: {e}")
            db.rollback()

    return matches_found
