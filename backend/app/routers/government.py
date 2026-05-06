"""Government dashboard endpoints."""

from fastapi import APIRouter, Depends, Query
from app.database import fetch
from app.routers.auth import require_role
from app.services import segmentation_service

router = APIRouter()


@router.get("/overview")
async def gov_overview(user=Depends(require_role("government"))):
    rows = await fetch(
        """SELECT up.state, COUNT(DISTINCT u.id) AS consumers, SUM(cd.energy_kwh) AS total_kwh,
                  AVG(cd.energy_kwh) AS avg_kwh_per_reading
           FROM users u JOIN user_profiles up ON u.id = up.user_id
           JOIN consumption_data cd ON u.id = cd.user_id
           WHERE cd.timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data)
           GROUP BY up.state ORDER BY total_kwh DESC""",
    )
    states = [{"state": r["state"], "consumers": r["consumers"], "totalKwh": round(float(r["total_kwh"]), 2),
               "avgKwhPerReading": round(float(r["avg_kwh_per_reading"]), 4)} for r in rows]
    return {"totalStates": len(states), "totalConsumers": sum(s["consumers"] for s in states),
            "totalKwh": round(sum(s["totalKwh"] for s in states), 2), "byState": states}


@router.get("/segmentation")
async def gov_segmentation(clusters: int = Query(3, ge=2, le=7), user=Depends(require_role("government"))):
    return await segmentation_service.segment_users(clusters)


@router.get("/tariff-distribution")
async def gov_tariff_distribution(user=Depends(require_role("government"))):
    rows = await fetch(
        """SELECT up.state, up.tariff_plan, COUNT(*) AS user_count
           FROM user_profiles up JOIN users u ON u.id = up.user_id
           GROUP BY up.state, up.tariff_plan ORDER BY up.state, user_count DESC""",
    )
    return {"distribution": [{"state": r["state"], "plan": r["tariff_plan"], "userCount": r["user_count"]} for r in rows]}


@router.get("/consumption-trend")
async def gov_consumption_trend(months: int = Query(6, ge=1, le=24), user=Depends(require_role("government"))):
    rows = await fetch(
        """SELECT date_trunc('month', timestamp) AS month, SUM(energy_kwh) AS total_kwh,
                  COUNT(DISTINCT user_id) AS active_users, AVG(energy_kwh) AS avg_per_reading
           FROM consumption_data
           WHERE timestamp >= (SELECT MAX(timestamp) - make_interval(months => $1) FROM consumption_data)
           GROUP BY month ORDER BY month""",
        months,
    )
    return {"months": months, "trend": [{"month": r["month"].strftime("%Y-%m"), "totalKwh": round(float(r["total_kwh"]), 2),
            "activeUsers": r["active_users"], "avgPerReading": round(float(r["avg_per_reading"]), 4)} for r in rows]}
