"""Recommendation engine — personalized energy saving tips."""

from uuid import UUID
from app.database import fetch, fetchrow, fetchval
from app.services.anomaly_service import get_peak_hours


async def get_recommendations(user_id: UUID) -> list[dict]:
    recommendations = []

    peak = await get_peak_hours(user_id)
    if peak.get("peakHours"):
        peak_str = ", ".join(f"{h}:00" for h in peak["peakHours"][:3])
        recommendations.append({
            "id": "shift_peak", "title": "Shift heavy usage away from peak hours",
            "description": f"Your peak hours are {peak_str}. Running washing machines, ACs, or geysers during off-peak hours can save 10-15% on your bill.",
            "estimatedSavings": "10-15%", "category": "timing", "priority": "high",
        })

    monthly = await fetch(
        """SELECT date_trunc('month', timestamp) AS month, SUM(energy_kwh) AS kwh
           FROM consumption_data
           WHERE user_id = $1
             AND timestamp >= (SELECT MAX(timestamp) - interval '3 months' FROM consumption_data WHERE user_id = $1)
           GROUP BY month ORDER BY month""",
        user_id,
    )
    if len(monthly) >= 2:
        latest, prev = float(monthly[-1]["kwh"]), float(monthly[-2]["kwh"])
        if latest > prev * 1.1:
            pct = round((latest - prev) / prev * 100)
            recommendations.append({
                "id": "rising_usage", "title": "Your usage is trending up",
                "description": f"This month's consumption is {pct}% higher than last month. Check for appliances running longer than usual or new devices.",
                "estimatedSavings": f"{pct//2}%", "category": "trend", "priority": "high",
            })

    comp = await fetchrow(
        """WITH user_max AS (
               SELECT date_trunc('month', MAX(timestamp)) AS ref FROM consumption_data WHERE user_id = $1
           ),
           user_kwh AS (
               SELECT SUM(energy_kwh) AS kwh FROM consumption_data
               WHERE user_id = $1
                 AND timestamp >= (SELECT ref - interval '1 month' FROM user_max)
                 AND timestamp < (SELECT ref FROM user_max)
           ),
           state_avg AS (
               SELECT AVG(sub.kwh) AS kwh FROM (
                   SELECT SUM(cd.energy_kwh) AS kwh
                   FROM consumption_data cd
                   JOIN user_profiles up ON cd.user_id = up.user_id
                   WHERE up.state = (SELECT state FROM user_profiles WHERE user_id = $1)
                     AND cd.timestamp >= (SELECT ref - interval '1 month' FROM user_max)
                     AND cd.timestamp < (SELECT ref FROM user_max)
                   GROUP BY cd.user_id
               ) sub
           )
           SELECT user_kwh.kwh AS user_kwh, state_avg.kwh AS avg_kwh
           FROM user_kwh, state_avg""",
        user_id,
    )
    if comp and comp["avg_kwh"] and comp["user_kwh"] > comp["avg_kwh"] * 1.2:
        pct = round((comp["user_kwh"] - comp["avg_kwh"]) / comp["avg_kwh"] * 100)
        recommendations.append({
            "id": "above_average", "title": "You're using more than your state average",
            "description": f"Your consumption is {pct}% above the average for your state. Consider an energy audit to identify inefficiencies.",
            "estimatedSavings": "15-25%", "category": "benchmark", "priority": "medium",
        })

    night_avg = await fetchval(
        """SELECT AVG(energy_kwh) FROM consumption_data
           WHERE user_id = $1 AND EXTRACT(HOUR FROM timestamp) BETWEEN 0 AND 5
             AND timestamp >= (SELECT MAX(timestamp) - interval '30 days' FROM consumption_data WHERE user_id = $1)""",
        user_id,
    )
    if night_avg and float(night_avg) > 0.3:
        recommendations.append({
            "id": "night_usage", "title": "High overnight consumption detected",
            "description": f"You're using an average of {round(float(night_avg), 2)} kWh per 5-min interval overnight (12 AM-5 AM). Check if ACs, heaters, or appliances are running unnecessarily.",
            "estimatedSavings": "5-10%", "category": "behavior", "priority": "medium",
        })

    recommendations.append({
        "id": "thermostat", "title": "Raise AC thermostat by 1°C",
        "description": "Every 1°C increase in AC temperature saves approximately 6-8% on cooling costs. Set it to 24-25°C instead of 22°C.",
        "estimatedSavings": "6-8%", "category": "appliance", "priority": "low",
    })
    recommendations.append({
        "id": "standby", "title": "Unplug standby appliances",
        "description": "TVs, chargers, and set-top boxes consume 5-10% of your total bill even when turned off. Use power strips to cut standby power.",
        "estimatedSavings": "5-10%", "category": "behavior", "priority": "low",
    })

    return recommendations
