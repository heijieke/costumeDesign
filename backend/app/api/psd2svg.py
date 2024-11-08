from fastapi import APIRouter
from services.psdService import psd2svg

router = APIRouter()

@router.get("/psd2svg/{path}", tags=["psd2svg"])
async def psd2svg(path):
    svg_path = psd2svg(path)
    return {"svg_path": svg_path}