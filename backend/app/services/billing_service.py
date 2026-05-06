"""Bill calculation engine — state-wise slab tariffs."""

from fastapi import HTTPException
from uuid import UUID
from app.database import fetch, fetchrow, fetchval


async def calculate_bill(user_id: UUID, month: int | None, year: int | None) -> dict:
    if not month or not year:
        latest = await fetchval(
            "SELECT MAX(timestamp) FROM consumption_data WHERE user_id = $1", user_id,
        )
        if latest:
            month, year = latest.month, latest.year
        else:
            from datetime import datetime
            month, year = datetime.now().month, datetime.now().year

    profile = await fetchrow("SELECT state, tariff_plan FROM user_profiles WHERE user_id = $1", user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    discom = await fetchrow("SELECT * FROM discoms WHERE state = $1 LIMIT 1", profile["state"])
    if not discom:
        raise HTTPException(status_code=404, detail=f"No DISCOM found for state: {profile['state']}")

    slabs = await fetch(
        "SELECT * FROM tariffs WHERE discom_id = $1 AND category = $2 ORDER BY slab_start",
        discom["id"], profile["tariff_plan"],
    )
    if not slabs:
        raise HTTPException(status_code=404, detail=f"No tariff slabs for {discom['name']} / {profile['tariff_plan']}")

    total_kwh = float(await fetchval(
        """SELECT COALESCE(SUM(energy_kwh), 0) FROM consumption_data
           WHERE user_id = $1 AND EXTRACT(MONTH FROM timestamp) = $2 AND EXTRACT(YEAR FROM timestamp) = $3""",
        user_id, month, year,
    ))

    remaining = total_kwh
    energy_charge = 0.0
    breakdown = []
    for slab in slabs:
        if remaining <= 0:
            break
        slab_end = slab["slab_end"] if slab["slab_end"] else float("inf")
        slab_width = slab_end - slab["slab_start"]
        units = min(remaining, slab_width)
        cost = units * slab["rate_per_unit"]
        energy_charge += cost
        remaining -= units
        breakdown.append({
            "slabStart": slab["slab_start"], "slabEnd": slab["slab_end"],
            "units": round(units, 2), "rate": slab["rate_per_unit"], "cost": round(cost, 2),
        })

    fixed = slabs[0]["fixed_charge"] if slabs else 0
    duty = round(energy_charge * discom["electricity_duty_pct"], 2)
    fuel = round(total_kwh * discom["fuel_surcharge_per_unit"], 2)
    total = round(energy_charge + fixed + duty + fuel, 2)

    return {
        "userId": str(user_id), "month": month, "year": year,
        "state": profile["state"], "discom": discom["name"], "regulator": discom["regulator"],
        "totalUnits": round(total_kwh, 2), "energyCharge": round(energy_charge, 2),
        "fixedCharge": fixed, "electricityDuty": duty, "fuelSurcharge": fuel,
        "totalCost": total, "breakdown": breakdown,
    }


async def get_bill_history(user_id: UUID, months: int = 6) -> list[dict]:
    rows = await fetch(
        """SELECT date_trunc('month', timestamp) AS month, SUM(energy_kwh) AS total_kwh
           FROM consumption_data
           WHERE user_id = $1
             AND timestamp >= (SELECT MAX(timestamp) - make_interval(months => $2)
                               FROM consumption_data WHERE user_id = $1)
           GROUP BY month ORDER BY month""",
        user_id, months,
    )
    return [
        {"month": r["month"].strftime("%Y-%m"), "totalUnits": round(r["total_kwh"], 2),
         "monthNum": r["month"].month, "yearNum": r["month"].year}
        for r in rows
    ]
