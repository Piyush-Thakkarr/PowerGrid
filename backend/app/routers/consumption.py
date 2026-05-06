"""Consumption data endpoints."""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.routers.auth import get_current_user
from app.services import consumption_service as svc

router = APIRouter()


@router.get("/live")
async def live_reading(user=Depends(get_current_user)):
    return await svc.get_live_reading(user["id"]) or {"error": "No data"}


@router.get("/stats")
async def stats(user=Depends(get_current_user)):
    return await svc.get_stats(user["id"])


@router.get("/hourly")
async def hourly(date: Optional[str] = Query(None), user=Depends(get_current_user)):
    return await svc.get_hourly(user["id"], date)


@router.get("/daily")
async def daily(start: Optional[str] = Query(None), end: Optional[str] = Query(None), user=Depends(get_current_user)):
    return await svc.get_daily(user["id"], start, end)


@router.get("/monthly")
async def monthly(months: int = Query(6, ge=1, le=24), user=Depends(get_current_user)):
    return await svc.get_monthly(user["id"], months)


@router.get("/heatmap")
async def heatmap(days: int = Query(30, ge=7, le=90), user=Depends(get_current_user)):
    return await svc.get_heatmap(user["id"], days)
