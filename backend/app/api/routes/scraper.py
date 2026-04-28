import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.settings import settings
from app.db.database import get_db
from app.models.domain import MediaAsset, ScannedContent
from app.schemas.requests import WebScraperRequest
from app.schemas.responses import WebScraperResponse, ScrapedImageMatch
from app.services.web_scraper import (
    scrape_images_from_url,
    calculate_similarity,
    ScraperAccessError,
    cleanup_scraped_file,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/scrape", response_model=WebScraperResponse)
async def scrape_and_compare(request: WebScraperRequest, db: Session = Depends(get_db)):
    """
    Scrape images from a URL and compare them with the user's uploaded image.
    
    Workflow:
    1. Validate the user's uploaded image exists
    2. Scrape up to 10 images from the provided URL
    3. Hash the scraped images
    4. Compare each scraped image's hash with the uploaded image's hash
    5. Return results based on similarity threshold
    """
    
    try:
        # Validate uploaded media exists
        uploaded_media = db.query(MediaAsset).filter(
            MediaAsset.id == request.media_id
        ).first()
        
        if not uploaded_media:
            raise HTTPException(
                status_code=404,
                detail=f"Uploaded image with ID {request.media_id} not found"
            )
        
        logger.info(f"Starting web scrape from URL: {request.url}")
        
        # Scrape images from URL
        scrape_result = scrape_images_from_url(str(request.url))
        scraped_images = scrape_result.images
        
        if not scraped_images:
            return WebScraperResponse(
                status="success",
                strategy_used=scrape_result.strategy_used,
                total_images_scraped=0,
                matches_found=0,
                similarity_threshold=request.similarity_threshold,
                results=[],
                message="No images found at the provided URL"
            )
        
        # Compare scraped images with uploaded image
        matches_found = []
        stored_matches = 0
        
        for scraped_image in scraped_images:
            similarity = calculate_similarity(uploaded_media.hash, scraped_image.image_hash)
            
            match_status = "match" if similarity >= request.similarity_threshold else "no_match"
            
            match_result = ScrapedImageMatch(
                file_path=scraped_image.source_url,
                similarity=similarity,
                status=match_status,
                ai_explanation=None
            )
            matches_found.append(match_result)
            
            if match_status == "match" and stored_matches < settings.SCRAPER_MAX_MATCHES_TO_STORE:
                scanned_content = ScannedContent(
                    file_path=scraped_image.source_url,
                    hash=scraped_image.image_hash,
                    source=str(request.url)
                )
                try:
                    db.add(scanned_content)
                    db.commit()
                    stored_matches += 1
                    logger.info(
                        "Stored matched image: %s with similarity %s%%",
                        scraped_image.source_url,
                        similarity,
                    )
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error storing scanned content: {e}")

            cleanup_scraped_file(scraped_image.file_path)
        
        # Filter results to show only matches
        matches_only = [m for m in matches_found if m.status == "match"]
        
        return WebScraperResponse(
            status="success",
            strategy_used=scrape_result.strategy_used,
            total_images_scraped=len(scraped_images),
            matches_found=len(matches_only),
            similarity_threshold=request.similarity_threshold,
            results=matches_found,
            message=(
                f"Scraped {len(scraped_images)} images. Found {len(matches_only)} matching image(s). "
                f"Stored up to {settings.SCRAPER_MAX_MATCHES_TO_STORE} matches to protect the free database tier."
            )
        )
        
    except HTTPException as e:
        raise e
    except ScraperAccessError as e:
        logger.warning(f"Scraper access blocked for URL {request.url}: {e}")
        raise HTTPException(
            status_code=502,
            detail=(
                f"The target website blocked automated access. {str(e)} "
                "Try a different public page, or use a source that permits scraping/API access."
            )
        )
    except Exception as e:
        logger.error(f"Error during web scraping: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during web scraping: {str(e)}"
        )
