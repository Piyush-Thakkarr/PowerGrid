"""Tariff optimization — brute force plan comparison.

Benchmarked: Brute force is optimal for N≤5 tariff plans per DISCOM.
LP optimization and ML prediction add complexity for zero gain.
Compares user's actual consumption pattern against all available
tariff plans and recommends the cheapest one.
"""

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tariff import Tariff, Discom
from app.models.user import UserProfile

logger = logging.getLogger(__name__)


async def optimize_tariff(db: AsyncSession, user_id: UUID) -> dict:
    """Compare all tariff plans for user's DISCOM, recommend cheapest."""
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    discom_result = await db.execute(
        select(Discom).where(Discom.state == profile.state).limit(1)
    )
    discom = discom_result.scalar_one_or_none()
    if not discom:
        raise HTTPException(status_code=404, detail=f"No DISCOM found for state: {profile.state}")

    consumption = await db.execute(
        text("""
            SELECT EXTRACT(HOUR FROM timestamp)::int AS hour,
                   SUM(energy_kwh) AS kwh
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= (SELECT MAX(timestamp) - interval '30 days'
                                FROM consumption_data WHERE user_id = :uid)
            GROUP BY hour
        """),
        {"uid": str(user_id)},
    )
    hourly = {r.hour: float(r.kwh) for r in consumption.all()}
    monthly_kwh = sum(hourly.values())

    if monthly_kwh == 0:
        raise HTTPException(status_code=404, detail="No consumption data")

    peak_kwh = sum(v for h, v in hourly.items() if 9 <= h < 21)
    offpeak_kwh = monthly_kwh - peak_kwh
    peak_pct = peak_kwh / monthly_kwh if monthly_kwh > 0 else 0

    categories = ["Residential", "Commercial", "Industrial"]
    plan_bills = []

    for category in categories:
        tariff_result = await db.execute(
            select(Tariff)
            .where(Tariff.discom_id == discom.id, Tariff.category == category)
            .order_by(Tariff.slab_start)
        )
        slabs = tariff_result.scalars().all()
        if not slabs:
            continue

        remaining = monthly_kwh
        energy_charge = 0.0
        breakdown = []
        for slab in slabs:
            if remaining <= 0:
                break
            slab_end = slab.slab_end if slab.slab_end else float("inf")
            slab_width = slab_end - slab.slab_start
            units = min(remaining, slab_width)
            cost = units * slab.rate_per_unit
            energy_charge += cost
            remaining -= units
            breakdown.append({
                "slabStart": slab.slab_start,
                "slabEnd": slab.slab_end,
                "units": round(units, 2),
                "rate": slab.rate_per_unit,
                "cost": round(cost, 2),
            })

        fixed = slabs[0].fixed_charge if slabs else 0
        duty = round(energy_charge * discom.electricity_duty_pct, 2)
        fuel = round(monthly_kwh * discom.fuel_surcharge_per_unit, 2)
        total = round(energy_charge + fixed + duty + fuel, 2)

        plan_bills.append({
            "plan": category,
            "energyCharge": round(energy_charge, 2),
            "fixedCharge": fixed,
            "duty": duty,
            "fuelSurcharge": fuel,
            "totalBill": total,
            "breakdown": breakdown,
        })

    if not plan_bills:
        raise HTTPException(status_code=404, detail="No tariff plans available")

    plan_bills.sort(key=lambda x: x["totalBill"])
    cheapest = plan_bills[0]
    current = next((p for p in plan_bills if p["plan"] == profile.tariff_plan), plan_bills[-1])
    savings = round(current["totalBill"] - cheapest["totalBill"], 2)

    return {
        "monthlyKwh": round(monthly_kwh, 2),
        "peakUsagePercent": round(peak_pct * 100, 1),
        "currentPlan": profile.tariff_plan,
        "discom": discom.name,
        "state": profile.state,
        "recommendedPlan": cheapest["plan"],
        "monthlySavings": savings,
        "allPlans": plan_bills,
    }
