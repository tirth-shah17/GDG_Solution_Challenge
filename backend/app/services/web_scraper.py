import os
import re
import uuid
import logging
from dataclasses import dataclass
from io import BytesIO
from typing import List, Optional
from urllib.parse import parse_qs, urljoin, urlparse, unquote

import imagehash
import requests
from bs4 import BeautifulSoup
from PIL import Image

from app.core.settings import settings

logger = logging.getLogger(__name__)

SCRAPED_IMAGES_DIR = "scraped_images"
os.makedirs(SCRAPED_IMAGES_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1",
}

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
SKIP_IMAGE_PATTERNS = ("logo", "icon", "avatar", "sprite", "placeholder", "banner")


class ScraperAccessError(Exception):
    """Raised when the target website blocks or rejects scraping."""


@dataclass
class ScrapedImage:
    source_url: str
    file_path: str
    image_hash: str


@dataclass
class ScrapeExecutionResult:
    strategy_used: str
    images: List[ScrapedImage]


def _create_session(url: str) -> requests.Session:
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    session = requests.Session()
    session.headers.update(
        {
            **HEADERS,
            "Referer": origin,
            "Origin": origin,
        }
    )
    return session


def _extract_pexels_query(url: str) -> Optional[str]:
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    if "query" in query_params and query_params["query"]:
        return query_params["query"][0].strip()

    match = re.search(r"/search/([^/?#]+)/?", parsed.path)
    if match:
        return unquote(match.group(1)).replace("-", " ").strip()

    return None


def _choose_file_extension(image_url: str, image: Image.Image) -> str:
    path = urlparse(image_url).path
    ext = os.path.splitext(path)[1].lower()
    if ext in SUPPORTED_IMAGE_EXTENSIONS:
        return ext

    image_format = (image.format or "").lower()
    if image_format in {"jpeg", "jpg"}:
        return ".jpg"
    if image_format in {"png", "gif", "webp"}:
        return f".{image_format}"
    return ".jpg"


def _save_image(image: Image.Image, image_url: str) -> str:
    image_copy = image.convert("RGB")
    file_extension = _choose_file_extension(image_url, image)
    file_path = os.path.join(SCRAPED_IMAGES_DIR, f"{uuid.uuid4()}{file_extension}")
    image_copy.save(file_path, quality=90)
    return file_path


def _download_and_hash_image(
    session: requests.Session,
    image_url: str,
    total_downloaded_bytes: int,
) -> tuple[Optional[ScrapedImage], int]:
    try:
        response = session.get(image_url, timeout=settings.SCRAPER_TIMEOUT_SECONDS, stream=True)
        if response.status_code in (401, 403):
            logger.warning("Target blocked image download: %s (%s)", image_url, response.status_code)
            return None, total_downloaded_bytes

        response.raise_for_status()

        content_length = int(response.headers.get("content-length", "0") or 0)
        if content_length and content_length > settings.SCRAPER_MAX_IMAGE_BYTES:
            logger.info("Skipping oversized image (%s bytes): %s", content_length, image_url)
            return None, total_downloaded_bytes

        chunks = []
        image_bytes = 0
        for chunk in response.iter_content(chunk_size=8192):
            if not chunk:
                continue
            image_bytes += len(chunk)
            total_downloaded_bytes += len(chunk)
            if image_bytes > settings.SCRAPER_MAX_IMAGE_BYTES:
                logger.info("Skipping image larger than configured limit: %s", image_url)
                return None, total_downloaded_bytes
            if total_downloaded_bytes > settings.SCRAPER_MAX_TOTAL_DOWNLOAD_BYTES:
                logger.info("Reached total scraper download cap while processing %s", image_url)
                return None, total_downloaded_bytes
            chunks.append(chunk)

        if image_bytes == 0:
            return None, total_downloaded_bytes

        payload = b"".join(chunks)
        image = Image.open(BytesIO(payload))
        image.verify()
        image = Image.open(BytesIO(payload))
        image_hash = str(imagehash.phash(image))
        file_path = _save_image(image, image_url)

        return ScrapedImage(source_url=image_url, file_path=file_path, image_hash=image_hash), total_downloaded_bytes
    except requests.exceptions.RequestException as exc:
        logger.warning("Failed to download image %s: %s", image_url, exc)
        return None, total_downloaded_bytes
    except Exception as exc:
        logger.warning("Failed to process image %s: %s", image_url, exc)
        return None, total_downloaded_bytes


def _extract_image_urls_from_html(page_url: str, html: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    candidates: list[str] = []
    seen: set[str] = set()

    for img_tag in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src", "data-original", "srcset", "data-srcset"):
            raw_value = img_tag.get(attr)
            if not raw_value:
                continue

            if attr.endswith("srcset"):
                value = raw_value.split(",")[0].strip().split(" ")[0]
            else:
                value = raw_value.strip()

            image_url = urljoin(page_url, value)
            lower_url = image_url.lower()

            if image_url.startswith("data:") or not image_url.startswith(("http://", "https://")):
                continue
            if any(pattern in lower_url for pattern in SKIP_IMAGE_PATTERNS):
                continue
            if image_url in seen:
                continue

            seen.add(image_url)
            candidates.append(image_url)

            if len(candidates) >= settings.SCRAPER_MAX_IMAGES * 3:
                return candidates

    return candidates


def _scrape_with_requests(url: str) -> List[ScrapedImage]:
    session = _create_session(url)
    response = session.get(url, timeout=settings.SCRAPER_TIMEOUT_SECONDS)
    if response.status_code in (401, 403):
        raise ScraperAccessError(
            f"Target site blocked access with HTTP {response.status_code}. "
            "This site may require a browser challenge, login, or an official API."
        )
    response.raise_for_status()

    image_urls = _extract_image_urls_from_html(url, response.text)
    if not image_urls:
        return []

    scraped_images: list[ScrapedImage] = []
    total_downloaded_bytes = 0
    for image_url in image_urls:
        if len(scraped_images) >= settings.SCRAPER_MAX_IMAGES:
            break
        if total_downloaded_bytes >= settings.SCRAPER_MAX_TOTAL_DOWNLOAD_BYTES:
            logger.info("Stopping scrape because total download cap was reached for %s", url)
            break

        scraped_image, total_downloaded_bytes = _download_and_hash_image(
            session,
            image_url,
            total_downloaded_bytes,
        )
        if scraped_image:
            scraped_images.append(scraped_image)

    return scraped_images


def _scrape_with_playwright(url: str) -> List[ScrapedImage]:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        logger.info("Playwright is not available in this environment: %s", exc)
        return []

    scraped_images: list[ScrapedImage] = []
    total_downloaded_bytes = 0

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(user_agent=HEADERS["User-Agent"])
            page.goto(url, wait_until="networkidle", timeout=settings.SCRAPER_TIMEOUT_SECONDS * 1000)
            html = page.content()
            browser.close()

        image_urls = _extract_image_urls_from_html(url, html)
        if not image_urls:
            return []

        session = _create_session(url)
        for image_url in image_urls:
            if len(scraped_images) >= settings.SCRAPER_MAX_IMAGES:
                break
            if total_downloaded_bytes >= settings.SCRAPER_MAX_TOTAL_DOWNLOAD_BYTES:
                break

            scraped_image, total_downloaded_bytes = _download_and_hash_image(
                session,
                image_url,
                total_downloaded_bytes,
            )
            if scraped_image:
                scraped_images.append(scraped_image)
    except Exception as exc:
        logger.warning("Playwright scraping failed for %s: %s", url, exc)

    return scraped_images


def _scrape_pexels_with_api(url: str) -> List[ScrapedImage]:
    if not settings.PEXELS_API_KEY:
        logger.info("PEXELS_API_KEY not configured; skipping Pexels API strategy.")
        return []

    search_query = _extract_pexels_query(url)
    if not search_query:
        logger.info("Could not infer a Pexels search query from %s", url)
        return []

    session = _create_session(url)
    session.headers["Authorization"] = settings.PEXELS_API_KEY
    api_url = "https://api.pexels.com/v1/search"

    response = session.get(
        api_url,
        params={"query": search_query, "per_page": settings.SCRAPER_MAX_IMAGES},
        timeout=settings.SCRAPER_TIMEOUT_SECONDS,
    )
    if response.status_code in (401, 403):
        raise ScraperAccessError(
            "Pexels API access was rejected. Check PEXELS_API_KEY or use another source."
        )
    response.raise_for_status()

    payload = response.json()
    photos = payload.get("photos", [])
    total_downloaded_bytes = 0
    scraped_images: list[ScrapedImage] = []

    for photo in photos[: settings.SCRAPER_MAX_IMAGES]:
        image_url = (
            photo.get("src", {}).get("large2x")
            or photo.get("src", {}).get("large")
            or photo.get("src", {}).get("original")
        )
        if not image_url:
            continue

        scraped_image, total_downloaded_bytes = _download_and_hash_image(
            session,
            image_url,
            total_downloaded_bytes,
        )
        if scraped_image:
            scraped_images.append(scraped_image)

    return scraped_images


def scrape_images_from_url(url: str) -> ScrapeExecutionResult:
    """
    Scrape a limited set of images from a URL using a safe multi-strategy pipeline.
    Strategy order:
    1. Domain-specific API when available (Pexels)
    2. Plain HTML scraping
    3. Browser rendering via Playwright
    """
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    strategies = []

    if "pexels.com" in domain:
        strategies.append(("pexels-api", lambda: _scrape_pexels_with_api(url)))

    strategies.extend(
        [
            ("html", lambda: _scrape_with_requests(url)),
            ("playwright", lambda: _scrape_with_playwright(url)),
        ]
    )

    last_access_error: Optional[Exception] = None
    for strategy_name, strategy in strategies:
        try:
            logger.info("Trying scraper strategy '%s' for %s", strategy_name, url)
            scraped_images = strategy()
            if scraped_images:
                logger.info(
                    "Scraper strategy '%s' succeeded for %s with %s image(s)",
                    strategy_name,
                    url,
                    len(scraped_images),
                )
                return ScrapeExecutionResult(
                    strategy_used=strategy_name,
                    images=scraped_images[: settings.SCRAPER_MAX_IMAGES],
                )
        except ScraperAccessError as exc:
            logger.warning("Scraper strategy '%s' blocked for %s: %s", strategy_name, url, exc)
            last_access_error = exc
        except requests.exceptions.RequestException as exc:
            logger.warning("Scraper strategy '%s' request failed for %s: %s", strategy_name, url, exc)
        except Exception as exc:
            logger.warning("Scraper strategy '%s' failed for %s: %s", strategy_name, url, exc)

    if last_access_error:
        raise last_access_error

    return ScrapeExecutionResult(strategy_used="none", images=[])


def cleanup_scraped_file(file_path: str) -> None:
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception as exc:
        logger.warning("Failed to clean up scraped file %s: %s", file_path, exc)


def calculate_similarity(hash1_str: str, hash2_str: str) -> float:
    """
    Calculate similarity percentage between two image hashes.
    Returns a value from 0 to 100.
    """
    try:
        hash1 = imagehash.hex_to_hash(hash1_str)
        hash2 = imagehash.hex_to_hash(hash2_str)
        distance = hash1 - hash2
        similarity = (1 - (distance / 64)) * 100
        return round(similarity, 2)
    except Exception as exc:
        logger.error("Error calculating similarity: %s", exc)
        return 0.0
