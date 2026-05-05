"""DISCOM / Utility dashboard endpoints.

Multi-tenancy: DISCOM users only see consumers in their own state.
State is derived from the DISCOM user's profile.
All queries use (:state IS NULL OR up.state = :state) — no f-string SQL.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import UserProfile
from app.routers.auth import require_role
from app.services import (
    segmentation_service, demand_response_service,
)

router = APIRouter()


async def _get_user_state(db: AsyncSession, user) -> str | None:
    result = await db.execute(select(UserProfile.state).where(UserProfile.user_id == user.id))
    return result.scalar_one_or_none()


@router.get("/overview")
async def discom_overview(
    user=Depends(require_role("discom", "government")),
    db: AsyncSession = Depends(get_db),
):
    state = await _get_user_state(db, user)

    result = await db.execute(
        text("""
            SELECT
                COUNT(DISTINCT cd.user_id) AS total_consumers,
                SUM(cd.energy_kwh) AS total_kwh_30d,
                AVG(cd.power_watts) AS avg_load_watts,
                MAX(cd.power_watts) AS peak_load_watts
            FROM consumption_data cd
            JOIN user_profiles up ON cd.user_id = up.user_id
            WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
            AND (CAST(:state AS text) IS NULL OR up.state = :state)
        """),
        {"state": state},
    )
    row = result.one()
    return {
        "totalConsumers": row.total_consumers or 0,
        "totalKwh30d": round(float(row.total_kwh_30d or 0), 2),
        "avgLoadWatts": round(float(row.avg_load_watts or 0), 1),
        "peakLoadWatts": round(float(row.peak_load_watts or 0), 1),
        "state": state,
    }


@router.get("/segmentation")
async def discom_segmentation(
    clusters: int = Query(3, ge=2, le=7),
    user=Depends(require_role("discom", "government")),
    db: AsyncSession = Depends(get_db),
):
    return await segmentation_service.segment_users(db, clusters)


@router.get("/demand")
async def discom_demand(
    days: int = Query(7, ge=1, le=30),
    user=Depends(require_role("discom", "grid_operator")),
    db: AsyncSession = Depends(get_db),
):
    return await demand_response_service.get_aggregate_demand(db, days)


@router.get("/anomalies")
async def discom_anomalies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
    user=Depends(require_role("discom")),
    db: AsyncSession = Depends(get_db),
):
    state = await _get_user_state(db, user)

    count_result = await db.execute(
        text("""
            SELECT COUNT(DISTINCT u.id)
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            JOIN consumption_data cd ON u.id = cd.user_id
            WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
            AND (CAST(:state AS text) IS NULL OR up.state = :state)
        """),
        {"state": state},
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        text("""
            SELECT u.id, u.email, up.state,
                   SUM(cd.energy_kwh) AS monthly_kwh,
                   AVG(cd.power_watts) AS avg_watts
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            JOIN consumption_data cd ON u.id = cd.user_id
            WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
            AND (CAST(:state AS text) IS NULL OR up.state = :state)
            GROUP BY u.id, u.email, up.state
            ORDER BY monthly_kwh DESC
            LIMIT :limit OFFSET :offset
        """),
        {"state": state, "limit": page_size, "offset": (page - 1) * page_size},
    )
    consumers = [
        {
            "userId": str(r.id),
            "email": r.email,
            "state": r.state,
            "monthlyKwh": round(float(r.monthly_kwh), 2),
            "avgWatts": round(float(r.avg_watts), 1),
        }
        for r in result.all()
    ]

    return {
        "consumers": consumers,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
    }


@router.get("/revenue")
async def discom_revenue(
    user=Depends(require_role("discom")),
    db: AsyncSession = Depends(get_db),
):
    state = await _get_user_state(db, user)

    result = await db.execute(
        text("""
            SELECT up.tariff_plan,
                   COUNT(DISTINCT u.id) AS user_count,
                   SUM(cd.energy_kwh) AS total_kwh
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            JOIN consumption_data cd ON u.id = cd.user_id
            WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
            AND (CAST(:state AS text) IS NULL OR up.state = :state)
            GROUP BY up.tariff_plan
        """),
        {"state": state},
    )
    plans = [
        {"plan": r.tariff_plan, "userCount": r.user_count, "totalKwh": round(float(r.total_kwh), 2)}
        for r in result.all()
    ]
    return {"byPlan": plans, "state": state}
