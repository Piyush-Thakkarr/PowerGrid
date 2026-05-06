"""Single dashboard endpoint — all data in one request."""

from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.services import consumption_service, billing_service, comparison_service, gamification_service

router = APIRouter()


async def _safe(coro):
    try:
        return await coro
    except Exception:
        return None


@router.get("")
async def get_dashboard(user=Depends(get_current_user)):
    uid = user["id"]
    return {
        "stats": await consumption_service.get_stats(uid),
        "monthly": await consumption_service.get_monthly(uid, 6),
        "hourly": await consumption_service.get_hourly(uid, None),
        "heatmap": await consumption_service.get_heatmap(uid, 30),
        "billing": await _safe(billing_service.calculate_bill(uid, None, None)),
        "billHistory": await billing_service.get_bill_history(uid, 6),
        "comparison": await _safe(comparison_service.get_comparison(uid)),
        "achievements": await gamification_service.get_achievements(uid),
        "challenges": await gamification_service.get_challenges(uid),
        "xp": await gamification_service.get_user_xp(uid),
        "leaderboard": await gamification_service.get_leaderboard(),
    }
