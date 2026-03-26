"""Comparison & benchmarking endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import comparison_service as svc

router = APIRouter()


@router.get("/")
async def comparison(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_comparison(db, user.id)
