"""Anomaly detection — STL decomposition + Z-score on residuals.

Benchmarked winner: STL + Z-score (F1=0.38) beat STL + Isolation Forest (0.32),
raw IF (0.13), Z-score (0.00), IQR (0.00), LOF (0.00), DBSCAN (0.00).
"""

import asyncio
import logging
from uuid import UUID

import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.helpers import get_user_daily
from app.services.ml_cache import get_cached_response, set_cached_response

logger = logging.getLogger(__name__)


def _run_stl_zscore(ts_values, ts_index, threshold):
    """Sync CPU work — runs in thread pool."""
    import pandas as pd
    from statsmodels.tsa.seasonal import STL

    ts = pd.Series(ts_values, index=ts_index).asfreq("D").ffill()

    stl = STL(ts, period=7, robust=True)
    result = stl.fit()

    residuals = result.resid.values
    res_std = residuals.std()
    if res_std == 0:
        return {"anomalies": [], "totalDays": len(ts), "anomalyCount": 0}

    z_scores = np.abs((residuals - residuals.mean()) / res_std)

    anomalies = []
    for i, z in enumerate(z_scores):
        if z > threshold:
            actual = float(ts.iloc[i])
            expected = float(result.trend.iloc[i] + result.seasonal.iloc[i])
            deviation_pct = round((actual - expected) / expected * 100, 1) if expected > 0 else 0
            anomalies.append({
                "date": ts.index[i].strftime("%Y-%m-%d"),
                "actual": round(actual, 2),
                "expected": round(expected, 2),
                "deviationPercent": deviation_pct,
                "severity": "high" if z > 3 else "medium" if z > 2.5 else "low",
                "zScore": round(float(z), 2),
            })

    return {
        "anomalies": sorted(anomalies, key=lambda x: -x["zScore"]),
        "totalDays": len(ts),
        "anomalyCount": len(anomalies),
        "threshold": threshold,
        "decomposition": {
            "dates": [d.strftime("%Y-%m-%d") for d in ts.index],
            "observed": [round(float(v), 2) for v in ts.values],
            "trend": [round(float(v), 2) for v in result.trend.values],
            "seasonal": [round(float(v), 2) for v in result.seasonal.values],
            "residual": [round(float(v), 2) for v in result.resid.values],
        },
    }


async def detect_anomalies(db: AsyncSession, user_id: UUID, threshold: float = 2.0) -> dict:
    cached = get_cached_response(user_id, "anomalies", threshold=threshold)
    if cached:
        return cached

    df = await get_user_daily(db, user_id)
    if len(df) < 30:
        return {"error": "Not enough data (need 30+ days)", "anomalies": []}

    ts = df.set_index("ds")["y"]
    resp = await asyncio.to_thread(_run_stl_zscore, ts.values, ts.index, threshold)
    set_cached_response(user_id, "anomalies", resp, threshold=threshold)
    return resp


async def get_peak_hours(db: AsyncSession, user_id: UUID, days: int = 30) -> dict:
    result = await db.execute(
        text("""
            SELECT EXTRACT(HOUR FROM timestamp)::int AS hour,
                   EXTRACT(DOW FROM timestamp)::int AS dow,
                   AVG(power_watts) AS avg_watts,
                   MAX(power_watts) AS peak_watts
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= (SELECT MAX(timestamp) - make_interval(days => :days) FROM consumption_data WHERE user_id = :uid)
            GROUP BY hour, dow
            ORDER BY dow, hour
        """),
        {"uid": str(user_id), "days": days},
    )
    rows = result.all()

    hourly_avg = {}
    for r in rows:
        hourly_avg.setdefault(r.hour, []).append(float(r.avg_watts))

    hourly_mean = {h: np.mean(v) for h, v in hourly_avg.items()}
    sorted_hours = sorted(hourly_mean.items(), key=lambda x: -x[1])

    return {
        "peakHours": [h for h, _ in sorted_hours[:4]],
        "offPeakHours": [h for h, _ in sorted_hours[-4:]],
        "hourlyProfile": [{"hour": h, "avgWatts": round(w, 1)} for h, w in sorted(hourly_mean.items())],
    }
