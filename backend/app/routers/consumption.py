"""Consumption data endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import consumption_service as svc

router = APIRouter()


@router.get("/live")
async def live_reading(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await svc.get_live_reading(db, user.id)
    return result or {"error": "No data"}


@router.get("/stats")
async def stats(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_stats(db, user.id)


@router.get("/hourly")
async def hourly(
    date: str = Query(..., description="YYYY-MM-DD"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_hourly(db, user.id, date)


@router.get("/daily")
async def daily(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_daily(db, user.id, start, end)


@router.get("/monthly")
async def monthly(
    months: int = Query(6, ge=1, le=24),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_monthly(db, user.id, months)


@router.get("/heatmap")
async def heatmap(
    days: int = Query(30, ge=7, le=90),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_heatmap(db, user.id, days)
