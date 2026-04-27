"""
Seed script: Insert achievements, challenges, user achievements,
             and compute initial leaderboard.
"""

import random
from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.gamification import (
    Achievement, Challenge, UserAchievement, UserChallenge, LeaderboardEntry,
)

# ---- Achievement definitions ----
ACHIEVEMENTS = [
    {
        "id": "first_week",
        "name": "First Week",
        "description": "Tracked electricity usage for 7 consecutive days.",
        "icon": "🌟",
        "criteria_json": {"type": "streak", "days": 7},
    },
    {
        "id": "green_warrior",
        "name": "Green Warrior",
        "description": "Reduced monthly consumption by 15% compared to previous month.",
        "icon": "🌿",
        "criteria_json": {"type": "reduction_pct", "value": 15},
    },
    {
        "id": "peak_saver",
        "name": "Peak Saver",
        "description": "Kept peak-hour usage below 30% of daily total for a full week.",
        "icon": "⚡",
        "criteria_json": {"type": "peak_ratio", "max_pct": 30, "days": 7},
    },
    {
        "id": "night_owl",
        "name": "Night Owl",
        "description": "Shifted 50% of heavy appliance usage to off-peak hours.",
        "icon": "🦉",
        "criteria_json": {"type": "offpeak_shift_pct", "value": 50},
    },
    {
        "id": "solar_champion",
        "name": "Solar Champion",
        "description": "Generated more solar energy than consumed in a single day.",
        "icon": "☀️",
        "criteria_json": {"type": "net_zero_day", "count": 1},
    },
    {
        "id": "budget_master",
        "name": "Budget Master",
        "description": "Stayed under monthly budget target for 3 consecutive months.",
        "icon": "💰",
        "criteria_json": {"type": "budget_streak", "months": 3},
    },
    {
        "id": "data_nerd",
        "name": "Data Nerd",
        "description": "Viewed analytics dashboard 30 times.",
        "icon": "📊",
        "criteria_json": {"type": "dashboard_views", "count": 30},
    },
    {
        "id": "community_hero",
        "name": "Community Hero",
        "description": "Ranked in top 10 on the leaderboard for any month.",
        "icon": "🏆",
        "criteria_json": {"type": "leaderboard_rank", "max_rank": 10},
    },
    {
        "id": "efficiency_expert",
        "name": "Efficiency Expert",
        "description": "Maintained per-capita consumption below state average for 30 days.",
        "icon": "🎯",
        "criteria_json": {"type": "below_avg_days", "days": 30},
    },
    {
        "id": "early_adopter",
        "name": "Early Adopter",
        "description": "One of the first 100 users to join PowerGrid.",
        "icon": "🚀",
        "criteria_json": {"type": "signup_order", "max_position": 100},
    },
]

# ---- Challenge definitions ----
CHALLENGES = [
    {
        "name": "Reduce 10% Challenge",
        "description": "Reduce your total electricity consumption by 10% compared to last month.",
        "target": 10.0,
        "unit": "%",
        "start_date": date(2025, 4, 1),
        "end_date": date(2025, 4, 30),
        "is_active": True,
    },
    {
        "name": "Peak Hour Shifter",
        "description": "Shift at least 20% of your peak-hour usage (2PM-5PM) to off-peak hours this month.",
        "target": 20.0,
        "unit": "%",
        "start_date": date(2025, 4, 1),
        "end_date": date(2025, 4, 30),
        "is_active": True,
    },
    {
        "name": "Weekend Warrior",
        "description": "Keep weekend usage below 15 kWh total for 4 consecutive weekends.",
        "target": 15.0,
        "unit": "kWh",
        "start_date": date(2025, 4, 1),
        "end_date": date(2025, 5, 31),
        "is_active": True,
    },
]


def get_sync_engine():
    settings = get_settings()
    return create_engine(settings.database_url_sync, echo=False)


def _get_user_ids(session):
    rows = session.execute(text("SELECT id FROM users ORDER BY created_at")).fetchall()
    return [row[0] for row in rows]


def _compute_user_consumption(session, user_ids):
    """Get total kWh per user from consumption_data (if available)."""
    result = session.execute(
        text("SELECT user_id, SUM(energy_kwh) as total FROM consumption_data GROUP BY user_id")
    ).fetchall()
    return {row[0]: float(row[1]) for row in result}


def seed_gamification(engine=None):
    """Seed achievements, challenges, and leaderboard."""
    if engine is None:
        engine = get_sync_engine()

    random.seed(42)

    with Session(engine) as session:
        # ---- Achievements ----
        existing_ach = session.execute(text("SELECT COUNT(*) FROM achievements")).scalar()
        if existing_ach and existing_ach >= len(ACHIEVEMENTS):
            print(f"  Achievements already seeded ({existing_ach} found). Skipping achievements.")
        else:
            if existing_ach and existing_ach > 0:
                session.execute(text("DELETE FROM user_achievements"))
                session.execute(text("DELETE FROM achievements"))
                session.commit()

            for ach_data in ACHIEVEMENTS:
                session.add(Achievement(**ach_data))
            session.commit()
            print(f"  Created {len(ACHIEVEMENTS)} achievements.")

        # ---- Challenges ----
        existing_ch = session.execute(text("SELECT COUNT(*) FROM challenges")).scalar()
        if existing_ch and existing_ch >= len(CHALLENGES):
            print(f"  Challenges already seeded ({existing_ch} found). Skipping challenges.")
        else:
            if existing_ch and existing_ch > 0:
                session.execute(text("DELETE FROM user_challenges"))
                session.execute(text("DELETE FROM challenges"))
                session.commit()

            for ch_data in CHALLENGES:
                session.add(Challenge(**ch_data))
            session.commit()
            print(f"  Created {len(CHALLENGES)} challenges.")

        # ---- Assign achievements to users ----
        user_ids = _get_user_ids(session)
        if not user_ids:
            print("  No users found. Skipping user assignments.")
            return

        existing_ua = session.execute(text("SELECT COUNT(*) FROM user_achievements")).scalar()
        if existing_ua and existing_ua > 0:
            print(f"  User achievements already assigned ({existing_ua}). Skipping.")
        else:
            achievement_ids = [a["id"] for a in ACHIEVEMENTS]
            assigned = 0
            for uid in user_ids:
                # Each user gets 2-5 random achievements
                n = random.randint(2, 5)
                chosen = random.sample(achievement_ids, min(n, len(achievement_ids)))
                for ach_id in chosen:
                    session.execute(
                        text("INSERT INTO user_achievements (user_id, achievement_id) VALUES (:uid, :aid)"),
                        {"uid": str(uid), "aid": ach_id},
                    )
                    assigned += 1
            session.commit()
            print(f"  Assigned {assigned} achievements across {len(user_ids)} users.")

        # ---- Assign challenges to users ----
        existing_uc = session.execute(text("SELECT COUNT(*) FROM user_challenges")).scalar()
        if existing_uc and existing_uc > 0:
            print(f"  User challenges already assigned ({existing_uc}). Skipping.")
        else:
            challenge_ids = [
                row[0] for row in
                session.execute(text("SELECT id FROM challenges")).fetchall()
            ]
            assigned_ch = 0
            for uid in user_ids:
                # Each user joins 1-3 challenges with random progress
                n = random.randint(1, min(3, len(challenge_ids)))
                chosen = random.sample(challenge_ids, n)
                for ch_id in chosen:
                    progress = round(random.uniform(0, 100), 1)
                    completed = progress >= 100.0
                    session.execute(
                        text("""INSERT INTO user_challenges
                            (user_id, challenge_id, progress, completed)
                            VALUES (:uid, :cid, :prog, :comp)"""),
                        {"uid": str(uid), "cid": ch_id,
                         "prog": min(progress, 100.0), "comp": completed},
                    )
                    assigned_ch += 1
            session.commit()
            print(f"  Assigned {assigned_ch} challenge enrollments across {len(user_ids)} users.")

        # ---- Leaderboard ----
        existing_lb = session.execute(text("SELECT COUNT(*) FROM leaderboard")).scalar()
        if existing_lb and existing_lb > 0:
            print(f"  Leaderboard already populated ({existing_lb}). Skipping.")
        else:
            # Compute from consumption data if available, else use random scores
            consumption_map = _compute_user_consumption(session, user_ids)
            period = "2025-04"

            scored_users = []
            for uid in user_ids:
                total_kwh = consumption_map.get(uid, 0)
                # Score: lower consumption = higher efficiency = more points
                # Base points from inverse of consumption + random bonus
                if total_kwh > 0:
                    # Normalize: ~200 kWh/month is average Indian household
                    efficiency = max(0, 200 - (total_kwh / 30))  # daily excess
                    points = int(max(100, 1000 - efficiency * 5) + random.randint(0, 100))
                    savings_pct = round(random.uniform(2.0, 25.0), 1)
                else:
                    points = random.randint(200, 1200)
                    savings_pct = round(random.uniform(2.0, 25.0), 1)

                scored_users.append((uid, points, savings_pct))

            # Sort by points descending for ranking
            scored_users.sort(key=lambda x: x[1], reverse=True)

            for rank, (uid, points, savings_pct) in enumerate(scored_users, 1):
                session.execute(
                    text("""INSERT INTO leaderboard
                        (user_id, period, rank, points, savings_percent)
                        VALUES (:uid, :period, :rank, :points, :savings)"""),
                    {"uid": str(uid), "period": period, "rank": rank,
                     "points": points, "savings": savings_pct},
                )
            session.commit()
            print(f"  Created leaderboard with {len(scored_users)} entries for {period}.")

        # ---- Set XP and Level for user profiles ----
        print("  Updating user XP and levels...")
        for uid in user_ids:
            # Count achievements for XP
            ach_count = session.execute(
                text("SELECT COUNT(*) FROM user_achievements WHERE user_id = :uid"),
                {"uid": uid},
            ).scalar() or 0

            # Count challenge completions
            ch_completed = session.execute(
                text("SELECT COUNT(*) FROM user_challenges WHERE user_id = :uid AND completed = true"),
                {"uid": uid},
            ).scalar() or 0

            # XP: 100 per achievement + 200 per completed challenge + random base
            xp = ach_count * 100 + ch_completed * 200 + random.randint(50, 300)
            level = min(50, max(1, xp // 250))

            session.execute(
                text("UPDATE user_profiles SET xp = :xp, level = :level WHERE user_id = :uid"),
                {"xp": xp, "level": level, "uid": uid},
            )

        session.commit()
        print(f"  Updated XP/levels for {len(user_ids)} users.")

    print("  Gamification seeding complete.")


if __name__ == "__main__":
    print("=== Seeding Gamification ===")
    seed_gamification()
