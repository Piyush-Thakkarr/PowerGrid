"""Single dashboard endpoint — returns all data in one request to avoid multiple cold starts."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import consumption_service, billing_service, comparison_service, gamification_service

router = APIRouter()


@router.get("")
async def get_dashboard(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all dashboard data in a single request."""
    stats = await consumption_service.get_stats(db, user.id)
    monthly = await consumption_service.get_monthly(db, user.id, 6)
    hourly = await consumption_service.get_hourly(db, user.id, None)
    heatmap = await consumption_service.get_heatmap(db, user.id, 30)
    billing = await billing_service.calculate_bill(db, user.id, None, None)
    bill_history = await billing_service.get_bill_history(db, user.id, 6)
    comparison = await comparison_service.get_comparison(db, user.id)
    achievements = await gamification_service.get_achievements(db, user.id)
    challenges = await gamification_service.get_challenges(db, user.id)
    xp = await gamification_service.get_user_xp(db, user.id)
    leaderboard = await gamification_service.get_leaderboard(db)

    return {
        "stats": stats,
        "monthly": monthly,
        "hourly": hourly,
        "heatmap": heatmap,
        "billing": billing,
        "billHistory": bill_history,
        "comparison": comparison,
        "achievements": achievements,
        "challenges": challenges,
        "xp": xp,
        "leaderboard": leaderboard,
    }
