"""Gamification endpoints."""

from fastapi import APIRouter, Depends, Query
from app.routers.auth import get_current_user
from app.services import gamification_service as svc

router = APIRouter()


@router.get("/achievements")
async def achievements(user=Depends(get_current_user)):
    return await svc.get_achievements(user["id"])


@router.get("/challenges")
async def challenges(user=Depends(get_current_user)):
    return await svc.get_challenges(user["id"])


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: int, user=Depends(get_current_user)):
    return await svc.join_challenge(user["id"], challenge_id)


@router.get("/leaderboard")
async def leaderboard(period: str | None = Query(None)):
    return await svc.get_leaderboard(period)


@router.get("/xp")
async def user_xp(user=Depends(get_current_user)):
    return await svc.get_user_xp(user["id"])
