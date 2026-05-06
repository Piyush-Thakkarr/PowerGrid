"""Comparison & benchmarking endpoints."""

from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.services import comparison_service as svc

router = APIRouter()


@router.get("/")
async def comparison(user=Depends(get_current_user)):
    return await svc.get_comparison(user["id"])
