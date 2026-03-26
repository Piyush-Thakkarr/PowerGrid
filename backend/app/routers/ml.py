"""ML endpoints — forecasting, anomaly detection, recommendations."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import forecast_service, anomaly_service, recommendation_service

router = APIRouter()


# ── Forecasting ────────────────────────────────────
@router.get("/forecast/sarima")
async def sarima_forecast(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast_sarima(db, user.id, horizon)


@router.get("/forecast/prophet")
async def prophet_forecast(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast_prophet(db, user.id, horizon)


@router.get("/forecast/neural")
async def neural_forecast(
    horizon: int = Query(7, ge=1, le=14),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast_neural(db, user.id, horizon)


@router.get("/forecast/compare")
async def compare_forecasts(
    horizon: int = Query(7, ge=1, le=14),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast_compare(db, user.id, horizon)


# ── Anomaly Detection ─────────────────────────────
@router.get("/anomalies")
async def anomalies(
    sensitivity: float = Query(0.05, ge=0.01, le=0.2),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await anomaly_service.detect_anomalies(db, user.id, sensitivity)


@router.get("/decomposition")
async def decomposition(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await anomaly_service.get_decomposition(db, user.id)


@router.get("/peak-hours")
async def peak_hours(
    days: int = Query(30, ge=7, le=90),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await anomaly_service.get_peak_hours(db, user.id, days)


# ── Recommendations ────────────────────────────────
@router.get("/recommendations")
async def recommendations(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await recommendation_service.get_recommendations(db, user.id)
