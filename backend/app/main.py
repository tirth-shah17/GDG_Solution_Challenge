from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, scan, results, scraper, insight
from app.core.logger import logger
from app.db.database import engine
from app.models.domain import Base

app = FastAPI(title="MediaShield AI", description="Digital Asset Protection System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(results.router, prefix="/api/results", tags=["results"])
app.include_router(scraper.router, prefix="/api/scraper", tags=["web-scraper"])
app.include_router(insight.router, prefix="/api/insight", tags=["insight"])


@app.on_event("startup")
async def startup_event():
    """
    Ensure the database schema exists before serving requests.
    This keeps local/dev environments from failing on first upload.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified successfully.")
    except Exception:
        logger.exception("Failed to initialize database schema on startup.")
        raise

@app.get("/")
async def root():
    return {"message": "Welcome to MediaShield AI API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
