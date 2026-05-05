"""Grid operator dashboard endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import require_role
from app.services import demand_response_service

router = APIRouter()


@router.get("/demand")
async def grid_demand(
    days: int = Query(7, ge=1, le=30),
    user=Depends(require_role("grid_operator", "discom")),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate demand curve for grid planning."""
    return await demand_response_service.get_aggregate_demand(db, days)


@router.get("/peak-history")
async def grid_peak_history(
    days: int = Query(30, ge=7, le=90),
    user=Depends(require_role("grid_operator")),
    db: AsyncSession = Depends(get_db),
):
    """Historical daily peak demand events."""
    result = await db.execute(
        text("""
            SELECT date_trunc('day', timestamp)::date AS day,
                   MAX(total_watts) AS peak_watts,
                   peak_hour
            FROM (
                SELECT timestamp,
                       SUM(power_watts) OVER (PARTITION BY date_trunc('hour', timestamp)) AS total_watts,
                       EXTRACT(HOUR FROM timestamp)::int AS peak_hour
                FROM consumption_data
                WHERE timestamp >= (SELECT MAX(timestamp) - make_interval(days => :days) FROM consumption_data)
            ) sub
            GROUP BY day, peak_hour
            ORDER BY day
        """),
        {"days": days},
    )
    rows = result.all()

    daily_peaks = {}
    for r in rows:
        day_str = r.day.strftime("%Y-%m-%d")
        peak_w = float(r.peak_watts)
        if day_str not in daily_peaks or peak_w > daily_peaks[day_str]["peakWatts"]:
            daily_peaks[day_str] = {
                "date": day_str,
                "peakWatts": round(peak_w, 1),
                "peakHour": r.peak_hour,
            }

    peaks = sorted(daily_peaks.values(), key=lambda x: x["date"])

    return {
        "days": days,
        "peakHistory": peaks,
        "maxPeak": max(peaks, key=lambda x: x["peakWatts"]) if peaks else None,
    }


@router.get("/load-distribution")
async def grid_load_distribution(
    user=Depends(require_role("grid_operator")),
    db: AsyncSession = Depends(get_db),
):
    """Load distribution by state/area."""
    result = await db.execute(
        text("""
            SELECT up.state,
                   SUM(cd.power_watts) AS total_load,
                   COUNT(DISTINCT cd.user_id) AS active_meters,
                   AVG(cd.power_watts) AS avg_per_meter
            FROM consumption_data cd
            JOIN user_profiles up ON cd.user_id = up.user_id
            WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '24 hours' FROM consumption_data)
            GROUP BY up.state
            ORDER BY total_load DESC
        """),
    )
    areas = [
        {
            "state": r.state,
            "totalLoadWatts": round(float(r.total_load), 1),
            "activeMeters": r.active_meters,
            "avgPerMeter": round(float(r.avg_per_meter), 1),
        }
        for r in result.all()
    ]
    return {"areas": areas}
