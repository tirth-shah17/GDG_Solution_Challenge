from fastapi import APIRouter, UploadFile, File

router = APIRouter()

@router.post("/")
async def upload_asset(file: UploadFile = File(...)):
    # TODO: Save file, generate perceptual hash, store in db
    return {"filename": file.filename, "status": "Asset uploaded successfully"}
