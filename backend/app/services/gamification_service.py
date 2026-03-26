"""Gamification — achievements, challenges, leaderboard, XP."""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.gamification import (
    Achievement, UserAchievement, Challenge, UserChallenge, LeaderboardEntry,
)
from app.models.user import UserProfile


async def get_achievements(db: AsyncSession, user_id: UUID) -> dict:
    """All achievements with user's unlock status."""
    all_achs = await db.execute(select(Achievement))
    user_achs = await db.execute(
        select(UserAchievement.achievement_id)
        .where(UserAchievement.user_id == user_id)
    )
    unlocked = {r[0] for r in user_achs}

    achievements = []
    for a in all_achs.scalars():
        achievements.append({
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "unlocked": a.id in unlocked,
        })

    return {
        "achievements": achievements,
        "totalUnlocked": len(unlocked),
        "totalAvailable": len(achievements),
    }


async def get_challenges(db: AsyncSession, user_id: UUID) -> list[dict]:
    """Active challenges with user's progress."""
    result = await db.execute(
        text("""
            SELECT c.id, c.name, c.description, c.target, c.unit,
                   c.start_date, c.end_date, c.is_active,
                   uc.progress, uc.completed, uc.joined_at
            FROM challenges c
            LEFT JOIN user_challenges uc
              ON c.id = uc.challenge_id AND uc.user_id = :uid
            WHERE c.is_active = true
            ORDER BY c.id
        """),
        {"uid": str(user_id)},
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "target": r.target,
            "unit": r.unit,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "endDate": r.end_date.isoformat() if r.end_date else None,
            "joined": r.joined_at is not None,
            "progress": round(r.progress, 1) if r.progress else 0,
            "completed": r.completed or False,
        }
        for r in result
    ]


async def join_challenge(db: AsyncSession, user_id: UUID, challenge_id: int) -> dict:
    """User joins a challenge."""
    existing = await db.execute(
        select(UserChallenge)
        .where(UserChallenge.user_id == user_id, UserChallenge.challenge_id == challenge_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_joined"}

    uc = UserChallenge(user_id=user_id, challenge_id=challenge_id)
    db.add(uc)
    await db.flush()
    return {"status": "joined", "challengeId": challenge_id}


async def get_leaderboard(db: AsyncSession, period: str | None = None) -> list[dict]:
    """Leaderboard for a given period (e.g. '2026-03')."""
    if not period:
        # Use latest period
        latest = await db.execute(
            select(LeaderboardEntry.period)
            .order_by(LeaderboardEntry.period.desc())
            .limit(1)
        )
        period = latest.scalar_one_or_none()
        if not period:
            return []

    result = await db.execute(
        text("""
            SELECT l.rank, l.points, l.savings_percent,
                   u.name, u.id AS user_id
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            WHERE l.period = :period
            ORDER BY l.rank ASC
            LIMIT 20
        """),
        {"period": period},
    )
    return [
        {
            "rank": r.rank,
            "name": r.name,
            "points": r.points,
            "savingsPercent": round(r.savings_percent, 1),
            "userId": str(r.user_id),
        }
        for r in result
    ]


async def get_user_xp(db: AsyncSession, user_id: UUID) -> dict:
    """User's XP, level, and progress to next level."""
    profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    p = profile.scalar_one_or_none()
    if not p:
        return {"xp": 0, "level": 1, "xpToNextLevel": 100, "progress": 0}

    xp_for_next = p.level * 100
    progress = min(100, round(p.xp % xp_for_next / xp_for_next * 100)) if xp_for_next > 0 else 0

    return {
        "xp": p.xp,
        "level": p.level,
        "xpToNextLevel": xp_for_next,
        "progress": progress,
    }
