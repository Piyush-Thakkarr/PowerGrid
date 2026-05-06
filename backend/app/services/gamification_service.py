"""Gamification — achievements, challenges, leaderboard, XP."""

from uuid import UUID
from app.database import fetch, fetchrow, fetchval, execute


async def get_achievements(user_id: UUID) -> dict:
    all_achs = await fetch("SELECT id, name, description, icon FROM achievements")
    unlocked_rows = await fetch(
        "SELECT achievement_id FROM user_achievements WHERE user_id = $1", user_id,
    )
    unlocked = {r["achievement_id"] for r in unlocked_rows}

    achievements = [
        {"id": a["id"], "name": a["name"], "description": a["description"],
         "icon": a["icon"], "unlocked": a["id"] in unlocked}
        for a in all_achs
    ]
    return {"achievements": achievements, "totalUnlocked": len(unlocked), "totalAvailable": len(achievements)}


async def get_challenges(user_id: UUID) -> list[dict]:
    rows = await fetch(
        """SELECT c.id, c.name, c.description, c.target, c.unit,
                  c.start_date, c.end_date, c.is_active,
                  uc.progress, uc.completed, uc.joined_at
           FROM challenges c
           LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
           WHERE c.is_active = true ORDER BY c.id""",
        user_id,
    )
    return [
        {"id": r["id"], "name": r["name"], "description": r["description"],
         "target": r["target"], "unit": r["unit"],
         "startDate": r["start_date"].isoformat() if r["start_date"] else None,
         "endDate": r["end_date"].isoformat() if r["end_date"] else None,
         "joined": r["joined_at"] is not None,
         "progress": round(r["progress"], 1) if r["progress"] else 0,
         "completed": r["completed"] or False}
        for r in rows
    ]


async def join_challenge(user_id: UUID, challenge_id: int) -> dict:
    existing = await fetchrow(
        "SELECT 1 FROM user_challenges WHERE user_id = $1 AND challenge_id = $2",
        user_id, challenge_id,
    )
    if existing:
        return {"status": "already_joined"}
    await execute(
        "INSERT INTO user_challenges (user_id, challenge_id) VALUES ($1, $2)", user_id, challenge_id,
    )
    return {"status": "joined", "challengeId": challenge_id}


async def get_leaderboard(period: str | None = None) -> list[dict]:
    if not period:
        period = await fetchval("SELECT period FROM leaderboard ORDER BY period DESC LIMIT 1")
        if not period:
            return []

    rows = await fetch(
        """SELECT l.rank, l.points, l.savings_percent, u.name, u.id AS user_id
           FROM leaderboard l JOIN users u ON l.user_id = u.id
           WHERE l.period = $1 ORDER BY l.rank ASC LIMIT 20""",
        period,
    )
    return [
        {"rank": r["rank"], "name": r["name"], "points": r["points"],
         "savingsPercent": round(r["savings_percent"], 1), "userId": str(r["user_id"])}
        for r in rows
    ]


async def get_user_xp(user_id: UUID) -> dict:
    p = await fetchrow("SELECT xp, level FROM user_profiles WHERE user_id = $1", user_id)
    if not p:
        return {"xp": 0, "level": 1, "xpToNextLevel": 100, "progress": 0}
    xp_for_next = p["level"] * 100
    progress = min(100, round(p["xp"] % xp_for_next / xp_for_next * 100)) if xp_for_next > 0 else 0
    return {"xp": p["xp"], "level": p["level"], "xpToNextLevel": xp_for_next, "progress": progress}
