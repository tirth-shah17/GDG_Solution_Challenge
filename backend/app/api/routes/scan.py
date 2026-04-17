from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def start_scan():
    # TODO: Trigger dataset scan, compare hashes, store matches
    return {"status": "Scan initiated"}
