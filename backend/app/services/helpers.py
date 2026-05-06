"""Shared helpers used across multiple services."""

from uuid import UUID
from app.database import fetch, fetchval


async def get_latest_date(user_id: UUID):
    return await fetchval(
        "SELECT MAX(timestamp) FROM consumption_data WHERE user_id = $1",
        user_id,
    )


async def get_user_daily(user_id: UUID, days: int = 180):
    import pandas as pd
    rows = await fetch(
        """
        SELECT date_trunc('day', timestamp)::date AS ds, SUM(energy_kwh) AS y
        FROM consumption_data
        WHERE user_id = $1
          AND timestamp >= (SELECT MAX(timestamp) - make_interval(days => $2)
                            FROM consumption_data WHERE user_id = $1)
        GROUP BY ds ORDER BY ds
        """,
        user_id, days,
    )
    if not rows:
        return pd.DataFrame(columns=["ds", "y"])
    df = pd.DataFrame([dict(r) for r in rows])
    df["ds"] = pd.to_datetime(df["ds"])
    return df
