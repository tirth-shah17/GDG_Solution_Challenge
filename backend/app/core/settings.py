from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediaShield AI"
    DATABASE_URL: str
    HASH_THRESHOLD: int = 5
    
    class Config:
        env_file = ".env"

settings = Settings()
