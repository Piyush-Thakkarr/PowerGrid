"""ML endpoints — 6 pipelines: forecast, anomaly, segmentation,
demand response, tariff optimization, NILM disaggregation."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import (
    forecast_service, anomaly_service, recommendation_service,
    segmentation_service, demand_response_service,
    tariff_optimization_service, nilm_service,
)

router = APIRouter()


# ── Pipeline 1: Forecasting (Extra Trees) ──────────
@router.get("/forecast")
async def forecast(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast(db, user.id, horizon)


# ── Pipeline 2: Anomaly Detection (STL + Z-score) ──
@router.get("/anomalies")
async def anomalies(
    threshold: float = Query(2.0, ge=1.5, le=3.5),
    sensitivity: float = Query(None, ge=0.01, le=0.2),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = threshold if sensitivity is None else max(1.5, min(3.5, 1 / sensitivity))
    return await anomaly_service.detect_anomalies(db, user.id, t)


# ── Pipeline 3: Segmentation (GMM) ─────────────────
@router.get("/segmentation")
async def segmentation(
    clusters: int = Query(3, ge=2, le=7),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await segmentation_service.segment_users(db, clusters)


@router.get("/segmentation/me")
async def my_segment(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await segmentation_service.get_user_segment(db, user.id)


# ── Pipeline 4: Demand Response (Gradient Boosting) ─
@router.get("/demand-response")
async def demand_response(
    hours: int = Query(24, ge=1, le=72),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await demand_response_service.predict_peak_hours(db, user.id, hours)


# ── Pipeline 5: Tariff Optimization (Brute Force) ──
@router.get("/tariff-optimizer")
async def tariff_optimizer(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await tariff_optimization_service.optimize_tariff(db, user.id)


# ── Pipeline 6: NILM Disaggregation (ToD + NMF) ────
@router.get("/nilm")
async def nilm_disaggregation(
    days: int = Query(30, ge=7, le=90),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await nilm_service.disaggregate(db, user.id, days)


# ── Recommendations (data-driven, uses peak hours) ─
@router.get("/recommendations")
async def recommendations(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await recommendation_service.get_recommendations(db, user.id)


# ── Backward compat for deployed frontend ───────────

@router.get("/forecast/compare")
async def forecast_compare_compat(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await forecast_service.forecast(db, user.id, horizon)
    return {"sarima": result, "extra_trees": result, "bestModel": "extra_trees"}


@router.get("/forecast/sarima")
async def forecast_sarima_compat(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast(db, user.id, horizon)


@router.get("/forecast/prophet")
async def forecast_prophet_compat(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast(db, user.id, horizon)


@router.get("/forecast/neural")
async def forecast_neural_compat(
    horizon: int = Query(7, ge=1, le=30),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await forecast_service.forecast(db, user.id, horizon)


@router.get("/decomposition")
async def decomposition_compat(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await anomaly_service.detect_anomalies(db, user.id)
    return result.get("decomposition", {})


@router.get("/peak-hours")
async def peak_hours_compat(
    days: int = Query(30, ge=7, le=90),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await anomaly_service.get_peak_hours(db, user.id, days)
