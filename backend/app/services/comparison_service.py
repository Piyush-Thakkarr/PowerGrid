"""Comparison & benchmarking — user vs state/national averages."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID


async def get_comparison(db: AsyncSession, user_id: UUID) -> dict:
    """Compare user's monthly consumption vs similar households and state avg.
    Uses latest data month as reference instead of NOW()."""
    result = await db.execute(
        text("""
            WITH ref AS (
                SELECT date_trunc('month', MAX(timestamp)) AS latest_month
                FROM consumption_data WHERE user_id = :uid
            ),
            user_monthly AS (
                SELECT SUM(energy_kwh) AS kwh
                FROM consumption_data, ref
                WHERE user_id = :uid
                  AND timestamp >= ref.latest_month - interval '1 month'
                  AND timestamp < ref.latest_month
            ),
            user_profile AS (
                SELECT state, household_size FROM user_profiles WHERE user_id = :uid
            ),
            state_avg AS (
                SELECT AVG(monthly_kwh) AS kwh FROM (
                    SELECT cd.user_id, SUM(cd.energy_kwh) AS monthly_kwh
                    FROM consumption_data cd
                    JOIN user_profiles up ON cd.user_id = up.user_id, ref
                    WHERE up.state = (SELECT state FROM user_profile)
                      AND cd.timestamp >= ref.latest_month - interval '1 month'
                      AND cd.timestamp < ref.latest_month
                    GROUP BY cd.user_id
                ) sub
            ),
            similar_hh AS (
                SELECT AVG(monthly_kwh) AS kwh FROM (
                    SELECT cd.user_id, SUM(cd.energy_kwh) AS monthly_kwh
                    FROM consumption_data cd
                    JOIN user_profiles up ON cd.user_id = up.user_id, ref
                    WHERE up.household_size = (SELECT household_size FROM user_profile)
                      AND cd.timestamp >= ref.latest_month - interval '1 month'
                      AND cd.timestamp < ref.latest_month
                    GROUP BY cd.user_id
                ) sub
            ),
            national_avg AS (
                SELECT AVG(monthly_kwh) AS kwh FROM (
                    SELECT user_id, SUM(energy_kwh) AS monthly_kwh
                    FROM consumption_data, ref
                    WHERE timestamp >= ref.latest_month - interval '1 month'
                      AND timestamp < ref.latest_month
                    GROUP BY user_id
                ) sub
            ),
            user_rank AS (
                SELECT rank FROM (
                    SELECT user_id,
                           RANK() OVER (ORDER BY SUM(energy_kwh) ASC) AS rank
                    FROM consumption_data, ref
                    WHERE timestamp >= ref.latest_month - interval '1 month'
                      AND timestamp < ref.latest_month
                    GROUP BY user_id
                ) ranked WHERE user_id = :uid
            ),
            total_users AS (
                SELECT COUNT(DISTINCT cd.user_id) AS cnt
                FROM consumption_data cd, ref
                WHERE cd.timestamp >= ref.latest_month - interval '1 month'
            )
            SELECT
                COALESCE(user_monthly.kwh, 0) AS user_kwh,
                COALESCE(state_avg.kwh, 0) AS state_avg_kwh,
                COALESCE(similar_hh.kwh, 0) AS similar_hh_kwh,
                COALESCE(national_avg.kwh, 0) AS national_avg_kwh,
                COALESCE(user_rank.rank, 0) AS user_rank,
                COALESCE(total_users.cnt, 1) AS total_users,
                user_profile.state,
                user_profile.household_size
            FROM user_monthly, state_avg, similar_hh, national_avg,
                 user_rank, total_users, user_profile
        """),
        {"uid": str(user_id)},
    )
    row = result.one_or_none()
    if not row or row.user_kwh == 0:
        return {"error": "No data available"}

    percentile = max(1, round(row.user_rank / row.total_users * 100))

    return {
        "yourMonthlyKwh": round(row.user_kwh, 2),
        "stateAvgKwh": round(row.state_avg_kwh, 2),
        "similarHouseholdKwh": round(row.similar_hh_kwh, 2),
        "nationalAvgKwh": round(row.national_avg_kwh, 2),
        "yourRank": row.user_rank,
        "totalUsers": row.total_users,
        "percentile": percentile,
        "state": row.state,
        "householdSize": row.household_size,
    }
