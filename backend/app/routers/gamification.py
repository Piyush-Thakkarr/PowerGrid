"""Gamification endpoints — achievements, challenges, leaderboard."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import gamification_service as svc

router = APIRouter()


@router.get("/achievements")
async def achievements(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_achievements(db, user.id)


@router.get("/challenges")
async def challenges(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_challenges(db, user.id)


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.join_challenge(db, user.id, challenge_id)


@router.get("/leaderboard")
async def leaderboard(
    period: str | None = Query(None, description="e.g. 2026-03"),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_leaderboard(db, period)


@router.get("/xp")
async def user_xp(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_user_xp(db, user.id)
