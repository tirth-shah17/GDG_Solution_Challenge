from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_results():
    # TODO: Retrieve matched items and violation flags from db
    return {"results": []}
