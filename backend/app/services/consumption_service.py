"""Consumption data queries — hourly, daily, monthly aggregations."""

from datetime import datetime, timedelta
from uuid import UUID

from app.database import fetch, fetchrow
from app.services.helpers import get_latest_date


async def _latest_date_str(user_id: UUID) -> str:
    latest = await get_latest_date(user_id)
    return latest.isoformat() if latest else datetime.now().isoformat()


async def get_hourly(user_id: UUID, date_str: str | None) -> list[dict]:
    if date_str and date_str != "null":
        target = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        target = None

    if target is None:
        latest = await _latest_date_str(user_id)
        target = datetime.fromisoformat(latest).date()

    start = datetime.combine(target, datetime.min.time())
    end = start + timedelta(days=1)

    rows = await fetch(
        """SELECT date_trunc('hour', timestamp) AS hour, SUM(energy_kwh) AS kwh,
                  AVG(power_watts) AS avg_watts, AVG(voltage) AS avg_voltage
           FROM consumption_data
           WHERE user_id = $1 AND timestamp >= $2 AND timestamp < $3
           GROUP BY hour ORDER BY hour""",
        user_id, start, end,
    )
    result = [
        {"hour": r["hour"].isoformat(), "kwh": round(r["kwh"], 3),
         "avgWatts": round(r["avg_watts"], 1),
         "avgVoltage": round(r["avg_voltage"], 1) if r["avg_voltage"] else None}
        for r in rows
    ]
    if not result and date_str:
        return await get_hourly(user_id, None)
    return result


async def get_daily(user_id: UUID, start_date: str | None, end_date: str | None) -> list[dict]:
    if start_date and end_date and start_date != "null":
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
    else:
        latest = await _latest_date_str(user_id)
        end_dt = datetime.fromisoformat(latest) + timedelta(days=1)
        start_dt = end_dt - timedelta(days=7)

    rows = await fetch(
        """SELECT date_trunc('day', timestamp) AS day, SUM(energy_kwh) AS kwh,
                  MAX(power_watts) AS peak_watts, AVG(power_watts) AS avg_watts
           FROM consumption_data
           WHERE user_id = $1 AND timestamp >= $2 AND timestamp < $3
           GROUP BY day ORDER BY day""",
        user_id, start_dt, end_dt,
    )
    result = [
        {"date": r["day"].strftime("%Y-%m-%d"), "kwh": round(r["kwh"], 3),
         "peakWatts": round(r["peak_watts"], 1), "avgWatts": round(r["avg_watts"], 1)}
        for r in rows
    ]
    if not result and start_date:
        return await get_daily(user_id, None, None)
    return result


async def get_monthly(user_id: UUID, months: int = 6) -> list[dict]:
    rows = await fetch(
        """SELECT date_trunc('month', timestamp) AS month, SUM(energy_kwh) AS kwh,
                  AVG(power_watts) AS avg_watts, COUNT(*) AS readings
           FROM consumption_data
           WHERE user_id = $1
             AND timestamp >= (SELECT MAX(timestamp) - make_interval(months => $2)
                               FROM consumption_data WHERE user_id = $1)
           GROUP BY month ORDER BY month""",
        user_id, months,
    )
    return [
        {"month": r["month"].strftime("%Y-%m"), "kwh": round(r["kwh"], 2),
         "avgWatts": round(r["avg_watts"], 1), "readings": r["readings"]}
        for r in rows
    ]


async def get_stats(user_id: UUID) -> dict:
    row = await fetchrow(
        """WITH ref AS (
               SELECT MAX(timestamp) AS latest FROM consumption_data WHERE user_id = $1
           ),
           this_month AS (
               SELECT SUM(energy_kwh) AS kwh FROM consumption_data, ref
               WHERE user_id = $1 AND timestamp >= date_trunc('month', ref.latest)
           ),
           last_month AS (
               SELECT SUM(energy_kwh) AS kwh FROM consumption_data, ref
               WHERE user_id = $1
                 AND timestamp >= date_trunc('month', ref.latest) - interval '1 month'
                 AND timestamp < date_trunc('month', ref.latest)
           ),
           today AS (
               SELECT SUM(energy_kwh) AS kwh FROM consumption_data, ref
               WHERE user_id = $1 AND timestamp >= date_trunc('day', ref.latest)
           ),
           peak AS (
               SELECT MAX(power_watts) AS watts FROM consumption_data, ref
               WHERE user_id = $1 AND timestamp >= date_trunc('day', ref.latest)
           )
           SELECT COALESCE(this_month.kwh, 0) AS this_month_kwh,
                  COALESCE(last_month.kwh, 0) AS last_month_kwh,
                  COALESCE(today.kwh, 0) AS today_kwh,
                  COALESCE(peak.watts, 0) AS peak_watts
           FROM this_month, last_month, today, peak""",
        user_id,
    )
    if not row:
        return {"thisMonthKwh": 0, "lastMonthKwh": 0, "monthChangePercent": 0, "todayKwh": 0, "peakWattsToday": 0}
    change = 0
    if row["last_month_kwh"] > 0:
        change = round((row["this_month_kwh"] - row["last_month_kwh"]) / row["last_month_kwh"] * 100, 1)
    return {
        "thisMonthKwh": round(row["this_month_kwh"], 2),
        "lastMonthKwh": round(row["last_month_kwh"], 2),
        "monthChangePercent": change,
        "todayKwh": round(row["today_kwh"], 2),
        "peakWattsToday": round(row["peak_watts"], 1),
    }
