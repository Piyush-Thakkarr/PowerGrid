"""Consumption data queries — hourly, daily, monthly aggregations."""

from datetime import datetime, timedelta
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.consumption import ConsumptionData


async def get_live_reading(db: AsyncSession, user_id: UUID) -> dict | None:
    """Latest reading for the real-time dashboard widget."""
    result = await db.execute(
        select(ConsumptionData)
        .where(ConsumptionData.user_id == user_id)
        .order_by(ConsumptionData.timestamp.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    return {
        "timestamp": row.timestamp.isoformat(),
        "powerWatts": row.power_watts,
        "energyKwh": row.energy_kwh,
        "voltage": row.voltage,
        "currentAmps": row.current_amps,
        "frequency": row.frequency,
    }


async def get_hourly(db: AsyncSession, user_id: UUID, date_str: str) -> list[dict]:
    """Hourly consumption for a specific date (24 data points)."""
    target = datetime.strptime(date_str, "%Y-%m-%d").date()
    start = datetime.combine(target, datetime.min.time())
    end = start + timedelta(days=1)

    result = await db.execute(
        text("""
            SELECT date_trunc('hour', timestamp) AS hour,
                   SUM(energy_kwh) AS kwh,
                   AVG(power_watts) AS avg_watts,
                   AVG(voltage) AS avg_voltage
            FROM consumption_data
            WHERE user_id = :uid AND timestamp >= :start AND timestamp < :end
            GROUP BY hour ORDER BY hour
        """),
        {"uid": str(user_id), "start": start, "end": end},
    )
    return [
        {"hour": row.hour.isoformat(), "kwh": round(row.kwh, 3),
         "avgWatts": round(row.avg_watts, 1), "avgVoltage": round(row.avg_voltage, 1) if row.avg_voltage else None}
        for row in result
    ]


async def get_daily(db: AsyncSession, user_id: UUID, start_date: str, end_date: str) -> list[dict]:
    """Daily consumption between two dates."""
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    result = await db.execute(
        text("""
            SELECT date_trunc('day', timestamp) AS day,
                   SUM(energy_kwh) AS kwh,
                   MAX(power_watts) AS peak_watts,
                   AVG(power_watts) AS avg_watts
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= :start
              AND timestamp < :end
            GROUP BY day ORDER BY day
        """),
        {"uid": str(user_id), "start": start_dt, "end": end_dt},
    )
    return [
        {"date": row.day.strftime("%Y-%m-%d"), "kwh": round(row.kwh, 3),
         "peakWatts": round(row.peak_watts, 1), "avgWatts": round(row.avg_watts, 1)}
        for row in result
    ]


async def get_monthly(db: AsyncSession, user_id: UUID, months: int = 6) -> list[dict]:
    """Monthly consumption for the last N months."""
    result = await db.execute(
        text("""
            SELECT date_trunc('month', timestamp) AS month,
                   SUM(energy_kwh) AS kwh,
                   AVG(power_watts) AS avg_watts,
                   COUNT(*) AS readings
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= NOW() - make_interval(months => :months)
            GROUP BY month ORDER BY month
        """),
        {"uid": str(user_id), "months": months},
    )
    return [
        {"month": row.month.strftime("%Y-%m"), "kwh": round(row.kwh, 2),
         "avgWatts": round(row.avg_watts, 1), "readings": row.readings}
        for row in result
    ]


async def get_heatmap(db: AsyncSession, user_id: UUID, days: int = 30) -> list[dict]:
    """Hourly heatmap data — avg kWh by day-of-week × hour."""
    result = await db.execute(
        text("""
            SELECT EXTRACT(DOW FROM timestamp)::int AS dow,
                   EXTRACT(HOUR FROM timestamp)::int AS hour,
                   AVG(energy_kwh) AS avg_kwh
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= NOW() - make_interval(days => :days)
            GROUP BY dow, hour
            ORDER BY dow, hour
        """),
        {"uid": str(user_id), "days": days},
    )
    return [
        {"dayOfWeek": row.dow, "hour": row.hour, "avgKwh": round(row.avg_kwh, 4)}
        for row in result
    ]


async def get_stats(db: AsyncSession, user_id: UUID) -> dict:
    """Summary stats for dashboard overview."""
    result = await db.execute(
        text("""
            WITH this_month AS (
                SELECT SUM(energy_kwh) AS kwh
                FROM consumption_data
                WHERE user_id = :uid AND timestamp >= date_trunc('month', NOW())
            ),
            last_month AS (
                SELECT SUM(energy_kwh) AS kwh
                FROM consumption_data
                WHERE user_id = :uid
                  AND timestamp >= date_trunc('month', NOW()) - interval '1 month'
                  AND timestamp < date_trunc('month', NOW())
            ),
            today AS (
                SELECT SUM(energy_kwh) AS kwh
                FROM consumption_data
                WHERE user_id = :uid AND timestamp >= date_trunc('day', NOW())
            ),
            peak AS (
                SELECT MAX(power_watts) AS watts
                FROM consumption_data
                WHERE user_id = :uid AND timestamp >= date_trunc('day', NOW())
            )
            SELECT
                COALESCE(this_month.kwh, 0) AS this_month_kwh,
                COALESCE(last_month.kwh, 0) AS last_month_kwh,
                COALESCE(today.kwh, 0) AS today_kwh,
                COALESCE(peak.watts, 0) AS peak_watts
            FROM this_month, last_month, today, peak
        """),
        {"uid": str(user_id)},
    )
    row = result.one()
    change = 0
    if row.last_month_kwh > 0:
        change = round((row.this_month_kwh - row.last_month_kwh) / row.last_month_kwh * 100, 1)

    return {
        "thisMonthKwh": round(row.this_month_kwh, 2),
        "lastMonthKwh": round(row.last_month_kwh, 2),
        "monthChangePercent": change,
        "todayKwh": round(row.today_kwh, 2),
        "peakWattsToday": round(row.peak_watts, 1),
    }
