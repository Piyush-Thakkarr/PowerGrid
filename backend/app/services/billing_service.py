"""Bill calculation engine — state-wise slab tariffs."""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.tariff import Tariff, Discom
from app.models.user import UserProfile


async def calculate_bill(db: AsyncSession, user_id: UUID, month: int, year: int) -> dict:
    """Calculate electricity bill for a user for a given month."""

    # Get user's state
    profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile.scalar_one_or_none()
    if not profile:
        return {"error": "Profile not found"}

    # Find DISCOM for user's state
    discom_result = await db.execute(
        select(Discom).where(Discom.state == profile.state).limit(1)
    )
    discom = discom_result.scalar_one_or_none()
    if not discom:
        return {"error": f"No DISCOM found for state: {profile.state}"}

    # Get tariff slabs for this DISCOM
    tariff_result = await db.execute(
        select(Tariff)
        .where(Tariff.discom_id == discom.id, Tariff.category == profile.tariff_plan)
        .order_by(Tariff.slab_start)
    )
    slabs = tariff_result.scalars().all()
    if not slabs:
        return {"error": f"No tariff slabs for {discom.name} / {profile.tariff_plan}"}

    # Get total consumption for the month
    consumption_result = await db.execute(
        text("""
            SELECT COALESCE(SUM(energy_kwh), 0) AS total_kwh
            FROM consumption_data
            WHERE user_id = :uid
              AND EXTRACT(MONTH FROM timestamp) = :month
              AND EXTRACT(YEAR FROM timestamp) = :year
        """),
        {"uid": str(user_id), "month": month, "year": year},
    )
    total_kwh = float(consumption_result.scalar())

    # Calculate slab-wise charges
    remaining = total_kwh
    energy_charge = 0.0
    breakdown = []

    for slab in slabs:
        if remaining <= 0:
            break
        slab_end = slab.slab_end if slab.slab_end else float("inf")
        slab_width = slab_end - slab.slab_start
        units_in_slab = min(remaining, slab_width)

        cost = units_in_slab * slab.rate_per_unit
        energy_charge += cost
        remaining -= units_in_slab

        breakdown.append({
            "slabStart": slab.slab_start,
            "slabEnd": slab.slab_end,
            "units": round(units_in_slab, 2),
            "rate": slab.rate_per_unit,
            "cost": round(cost, 2),
        })

    # Fixed charge (from first slab, same for all)
    fixed_charge = slabs[0].fixed_charge if slabs else 0

    # Electricity duty
    duty = round(energy_charge * discom.electricity_duty_pct, 2)

    # Fuel surcharge
    fuel_surcharge = round(total_kwh * discom.fuel_surcharge_per_unit, 2)

    total = round(energy_charge + fixed_charge + duty + fuel_surcharge, 2)

    return {
        "userId": str(user_id),
        "month": month,
        "year": year,
        "state": profile.state,
        "discom": discom.name,
        "regulator": discom.regulator,
        "totalUnits": round(total_kwh, 2),
        "energyCharge": round(energy_charge, 2),
        "fixedCharge": fixed_charge,
        "electricityDuty": duty,
        "fuelSurcharge": fuel_surcharge,
        "totalCost": total,
        "breakdown": breakdown,
    }


async def get_bill_history(db: AsyncSession, user_id: UUID, months: int = 6) -> list[dict]:
    """Monthly bill summaries for the last N months."""
    result = await db.execute(
        text("""
            SELECT date_trunc('month', timestamp) AS month,
                   SUM(energy_kwh) AS total_kwh
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= NOW() - make_interval(months => :months)
            GROUP BY month ORDER BY month
        """),
        {"uid": str(user_id), "months": months},
    )

    bills = []
    for row in result:
        # Quick estimate using average rate (detailed calc via calculate_bill)
        month_num = row.month.month
        year_num = row.month.year
        bills.append({
            "month": row.month.strftime("%Y-%m"),
            "totalUnits": round(row.total_kwh, 2),
            "monthNum": month_num,
            "yearNum": year_num,
        })

    return bills
