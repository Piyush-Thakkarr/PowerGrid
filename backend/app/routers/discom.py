"""DISCOM dashboard endpoints — multi-tenancy via state scoping."""

from fastapi import APIRouter, Depends, Query
from app.database import fetch, fetchrow, fetchval
from app.routers.auth import require_role
from app.services import segmentation_service, demand_response_service

router = APIRouter()


async def _get_state(user):
    row = await fetchrow("SELECT state FROM user_profiles WHERE user_id = $1", user["id"])
    return row["state"] if row else None


@router.get("/overview")
async def discom_overview(user=Depends(require_role("discom", "government"))):
    state = await _get_state(user)
    row = await fetchrow(
        """SELECT COUNT(DISTINCT cd.user_id) AS total_consumers,
                  SUM(cd.energy_kwh) AS total_kwh_30d,
                  AVG(cd.power_watts) AS avg_load_watts,
                  MAX(cd.power_watts) AS peak_load_watts
           FROM consumption_data cd
           JOIN user_profiles up ON cd.user_id = up.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
           AND (CAST($1 AS text) IS NULL OR up.state = $1)""",
        state,
    )
    return {
        "totalConsumers": row["total_consumers"] or 0,
        "totalKwh30d": round(float(row["total_kwh_30d"] or 0), 2),
        "avgLoadWatts": round(float(row["avg_load_watts"] or 0), 1),
        "peakLoadWatts": round(float(row["peak_load_watts"] or 0), 1),
        "state": state,
    }


@router.get("/segmentation")
async def discom_segmentation(clusters: int = Query(3, ge=2, le=7), user=Depends(require_role("discom", "government"))):
    return await segmentation_service.segment_users(clusters)


@router.get("/demand")
async def discom_demand(days: int = Query(7, ge=1, le=30), user=Depends(require_role("discom", "grid_operator"))):
    return await demand_response_service.get_aggregate_demand(days)


@router.get("/anomalies")
async def discom_anomalies(page: int = Query(1, ge=1), page_size: int = Query(50, ge=10, le=200), user=Depends(require_role("discom"))):
    state = await _get_state(user)
    total = await fetchval(
        """SELECT COUNT(DISTINCT u.id) FROM users u
           JOIN user_profiles up ON u.id = up.user_id
           JOIN consumption_data cd ON u.id = cd.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
           AND (CAST($1 AS text) IS NULL OR up.state = $1)""",
        state,
    )
    rows = await fetch(
        """SELECT u.id, u.email, up.state, SUM(cd.energy_kwh) AS monthly_kwh, AVG(cd.power_watts) AS avg_watts
           FROM users u JOIN user_profiles up ON u.id = up.user_id
           JOIN consumption_data cd ON u.id = cd.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
           AND (CAST($1 AS text) IS NULL OR up.state = $1)
           GROUP BY u.id, u.email, up.state ORDER BY monthly_kwh DESC
           LIMIT $2 OFFSET $3""",
        state, page_size, (page - 1) * page_size,
    )
    return {
        "consumers": [{"userId": str(r["id"]), "email": r["email"], "state": r["state"],
                       "monthlyKwh": round(float(r["monthly_kwh"]), 2), "avgWatts": round(float(r["avg_watts"]), 1)} for r in rows],
        "total": total or 0, "page": page, "pageSize": page_size,
        "totalPages": ((total or 0) + page_size - 1) // page_size,
    }


@router.get("/revenue")
async def discom_revenue(user=Depends(require_role("discom"))):
    state = await _get_state(user)
    rows = await fetch(
        """SELECT up.tariff_plan, COUNT(DISTINCT u.id) AS user_count, SUM(cd.energy_kwh) AS total_kwh
           FROM users u JOIN user_profiles up ON u.id = up.user_id
           JOIN consumption_data cd ON u.id = cd.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
           AND (CAST($1 AS text) IS NULL OR up.state = $1)
           GROUP BY up.tariff_plan""",
        state,
    )
    return {"byPlan": [{"plan": r["tariff_plan"], "userCount": r["user_count"], "totalKwh": round(float(r["total_kwh"]), 2)} for r in rows], "state": state}
