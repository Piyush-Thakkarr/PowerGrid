"""Shared helpers used across multiple services."""

from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_latest_date(db: AsyncSession, user_id: UUID):
    """Get the most recent timestamp for a user's consumption data."""
    result = await db.execute(
        text("SELECT MAX(timestamp) FROM consumption_data WHERE user_id = :uid"),
        {"uid": str(user_id)},
    )
    return result.scalar()


async def get_user_daily(db: AsyncSession, user_id: UUID, days: int = 180):
    """Fetch user's daily consumption as a DataFrame (ds=date, y=daily_kwh)."""
    result = await db.execute(
        text("""
            SELECT date_trunc('day', timestamp)::date AS ds,
                   SUM(energy_kwh) AS y
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= (SELECT MAX(timestamp) - make_interval(days => :days)
                                FROM consumption_data WHERE user_id = :uid)
            GROUP BY ds ORDER BY ds
        """),
        {"uid": str(user_id), "days": days},
    )
    import pandas as pd
    rows = result.all()
    if not rows:
        return pd.DataFrame(columns=["ds", "y"])
    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    return df
