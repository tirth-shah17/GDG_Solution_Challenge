from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediaShield AI"
    DATABASE_URL: str
    HASH_THRESHOLD: int = 5
    SCRAPER_MAX_IMAGES: int = 8
    SCRAPER_MAX_MATCHES_TO_STORE: int = 3
    SCRAPER_TIMEOUT_SECONDS: int = 10
    SCRAPER_MAX_IMAGE_BYTES: int = 5 * 1024 * 1024
    SCRAPER_MAX_TOTAL_DOWNLOAD_BYTES: int = 20 * 1024 * 1024
    PEXELS_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"

settings = Settings()
