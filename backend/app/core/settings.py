from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediaShield AI"
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname" # Update with Neon Postgres URL
    HASH_THRESHOLD: int = 5 # Hamming distance threshold for similarity
    
    class Config:
        env_file = ".env"

settings = Settings()
