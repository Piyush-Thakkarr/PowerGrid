"""Single dashboard endpoint — all data in one request."""

from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.services import consumption_service, billing_service, comparison_service, gamification_service

router = APIRouter()


async def _safe(coro, default=None):
    try:
        return await coro
    except Exception:
        return default


@router.get("")
async def get_dashboard(user=Depends(get_current_user)):
    uid = user["id"]
    return {
        "stats": await _safe(consumption_service.get_stats(uid), {}),
        "monthly": await _safe(consumption_service.get_monthly(uid, 6), []),
        "hourly": await _safe(consumption_service.get_hourly(uid, None), []),
        "heatmap": await _safe(consumption_service.get_heatmap(uid, 30), []),
        "billing": await _safe(billing_service.calculate_bill(uid, None, None)),
        "billHistory": await _safe(billing_service.get_bill_history(uid, 6), []),
        "comparison": await _safe(comparison_service.get_comparison(uid)),
        "achievements": await _safe(gamification_service.get_achievements(uid), {"achievements": [], "totalUnlocked": 0, "totalAvailable": 0}),
        "challenges": await _safe(gamification_service.get_challenges(uid), []),
        "xp": await _safe(gamification_service.get_user_xp(uid), {"xp": 0, "level": 1, "xpToNextLevel": 100, "progress": 0}),
        "leaderboard": await _safe(gamification_service.get_leaderboard(), []),
    }
