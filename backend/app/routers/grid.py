"""Grid operator dashboard endpoints."""

from fastapi import APIRouter, Depends, Query
from app.database import fetch
from app.routers.auth import require_role
from app.services import demand_response_service

router = APIRouter()


@router.get("/demand")
async def grid_demand(days: int = Query(7, ge=1, le=30), user=Depends(require_role("grid_operator", "discom"))):
    return await demand_response_service.get_aggregate_demand(days)


@router.get("/peak-history")
async def grid_peak_history(days: int = Query(30, ge=7, le=90), user=Depends(require_role("grid_operator"))):
    rows = await fetch(
        """SELECT date_trunc('day', timestamp)::date AS day,
                  MAX(sub.total_watts) AS peak_watts, sub.peak_hour
           FROM (
               SELECT timestamp, SUM(power_watts) OVER (PARTITION BY date_trunc('hour', timestamp)) AS total_watts,
                      EXTRACT(HOUR FROM timestamp)::int AS peak_hour
               FROM consumption_data
               WHERE timestamp >= (SELECT MAX(timestamp) - make_interval(days => $1) FROM consumption_data)
           ) sub
           GROUP BY day, peak_hour ORDER BY day""",
        days,
    )
    daily_peaks = {}
    for r in rows:
        day_str = r["day"].strftime("%Y-%m-%d")
        pw = float(r["peak_watts"])
        if day_str not in daily_peaks or pw > daily_peaks[day_str]["peakWatts"]:
            daily_peaks[day_str] = {"date": day_str, "peakWatts": round(pw, 1), "peakHour": r["peak_hour"]}

    peaks = sorted(daily_peaks.values(), key=lambda x: x["date"])
    max_peak = max(peaks, key=lambda x: x["peakWatts"])["peakWatts"] if peaks else None
    return {"days": days, "peakHistory": peaks, "maxPeak": max_peak}


@router.get("/load-distribution")
async def grid_load_distribution(user=Depends(require_role("grid_operator"))):
    rows = await fetch(
        """SELECT up.state, SUM(cd.power_watts) AS total_load,
                  COUNT(DISTINCT cd.user_id) AS active_meters, AVG(cd.power_watts) AS avg_per_meter
           FROM consumption_data cd JOIN user_profiles up ON cd.user_id = up.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '24 hours' FROM consumption_data)
           GROUP BY up.state ORDER BY total_load DESC""",
    )
    return {"areas": [{"state": r["state"], "totalLoadWatts": round(float(r["total_load"]), 1),
            "activeMeters": r["active_meters"], "avgPerMeter": round(float(r["avg_per_meter"]), 1)} for r in rows]}
