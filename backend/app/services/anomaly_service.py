"""
Anomaly detection — STL decomposition + Isolation Forest.

Finds unusual consumption patterns (spikes, drops) that deviate
from the user's normal trend + seasonal behavior.
"""

import logging
from uuid import UUID

import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def _get_user_daily(db: AsyncSession, user_id: UUID, days: int = 180) -> pd.DataFrame:
    result = await db.execute(
        text("""
            SELECT date_trunc('day', timestamp)::date AS ds,
                   SUM(energy_kwh) AS y
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= (SELECT MAX(timestamp) - make_interval(days => :days) FROM consumption_data WHERE user_id = :uid)
            GROUP BY ds ORDER BY ds
        """),
        {"uid": str(user_id), "days": days},
    )
    rows = result.all()
    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    return df


async def detect_anomalies(db: AsyncSession, user_id: UUID, sensitivity: float = 0.05) -> dict:
    """
    Detect anomalies using STL decomposition + Isolation Forest.

    1. STL strips trend + seasonality → residuals
    2. Isolation Forest flags outlier residuals
    3. Return flagged dates with severity scores
    """
    from statsmodels.tsa.seasonal import STL
    from sklearn.ensemble import IsolationForest

    df = await _get_user_daily(db, user_id)
    if len(df) < 30:
        return {"error": "Not enough data (need 30+ days)", "anomalies": []}

    ts = df.set_index("ds")["y"].asfreq("D").ffill()

    # STL decomposition (period=7 for weekly seasonality)
    stl = STL(ts, period=7, robust=True)
    result = stl.fit()

    residuals = result.resid.values.reshape(-1, 1)

    # Isolation Forest on residuals
    iso = IsolationForest(contamination=sensitivity, random_state=42)
    labels = iso.fit_predict(residuals)  # -1 = anomaly, 1 = normal
    scores = iso.decision_function(residuals)  # lower = more anomalous

    anomalies = []
    for i, (label, score) in enumerate(zip(labels, scores)):
        if label == -1:
            date = ts.index[i]
            actual = float(ts.iloc[i])
            expected = float(result.trend.iloc[i] + result.seasonal.iloc[i])
            deviation_pct = round((actual - expected) / expected * 100, 1) if expected > 0 else 0

            anomalies.append({
                "date": date.strftime("%Y-%m-%d"),
                "actual": round(actual, 2),
                "expected": round(expected, 2),
                "deviationPercent": deviation_pct,
                "severity": "high" if abs(deviation_pct) > 50 else "medium" if abs(deviation_pct) > 25 else "low",
                "anomalyScore": round(float(score), 4),
            })

    return {
        "anomalies": sorted(anomalies, key=lambda x: x["anomalyScore"]),
        "totalDays": len(ts),
        "anomalyCount": len(anomalies),
        "sensitivityUsed": sensitivity,
    }


async def get_decomposition(db: AsyncSession, user_id: UUID) -> dict:
    """
    STL decomposition — break usage into trend, seasonal, residual.
    Returns arrays for charting.
    """
    from statsmodels.tsa.seasonal import STL

    df = await _get_user_daily(db, user_id)
    if len(df) < 14:
        return {"error": "Not enough data (need 14+ days)"}

    ts = df.set_index("ds")["y"].asfreq("D").ffill()

    stl = STL(ts, period=7, robust=True)
    result = stl.fit()

    dates = [d.strftime("%Y-%m-%d") for d in ts.index]

    return {
        "dates": dates,
        "observed": [round(float(v), 2) for v in ts.values],
        "trend": [round(float(v), 2) for v in result.trend.values],
        "seasonal": [round(float(v), 2) for v in result.seasonal.values],
        "residual": [round(float(v), 2) for v in result.resid.values],
    }


async def get_peak_hours(db: AsyncSession, user_id: UUID, days: int = 30) -> dict:
    """Identify peak consumption hours from historical patterns."""
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

    # Find overall peak hours (top 4 hours by avg watts)
    hourly_avg = {}
    for r in rows:
        hourly_avg.setdefault(r.hour, []).append(float(r.avg_watts))

    hourly_mean = {h: np.mean(v) for h, v in hourly_avg.items()}
    sorted_hours = sorted(hourly_mean.items(), key=lambda x: -x[1])
    peak_hours = [h for h, _ in sorted_hours[:4]]
    off_peak_hours = [h for h, _ in sorted_hours[-4:]]

    return {
        "peakHours": peak_hours,
        "offPeakHours": off_peak_hours,
        "hourlyProfile": [
            {"hour": h, "avgWatts": round(w, 1)}
            for h, w in sorted(hourly_mean.items())
        ],
    }
