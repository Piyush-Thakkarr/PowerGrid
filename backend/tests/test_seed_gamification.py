"""Tests for seed_gamification.py"""

import uuid
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from tests.conftest_seed import sync_engine, sync_session  # noqa: F401

from app.seed.seed_gamification import (
    seed_gamification,
    ACHIEVEMENTS,
    CHALLENGES,
)
from app.models.user import User, UserProfile


def _create_test_users(engine, n=10):
    """Helper: insert N test users."""
    ids = []
    with Session(engine) as session:
        for i in range(n):
            uid = uuid.uuid4()
            user = User(id=uid, email=f"gtest{i}@example.com", name=f"GTest {i}")
            session.add(user)
            session.flush()
            profile = UserProfile(user_id=uid, state="Gujarat", discom="UGVCL")
            session.add(profile)
            ids.append(uid)
        session.commit()
    return ids


class TestSeedGamification:
    """Test gamification seeding."""

    def test_creates_all_achievements(self, sync_engine, sync_session):
        """Should create all defined achievements."""
        _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        count = sync_session.execute(text("SELECT COUNT(*) FROM achievements")).scalar()
        assert count == len(ACHIEVEMENTS)

    def test_creates_all_challenges(self, sync_engine, sync_session):
        """Should create all defined challenges."""
        _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        count = sync_session.execute(text("SELECT COUNT(*) FROM challenges")).scalar()
        assert count == len(CHALLENGES)

    def test_assigns_achievements_to_users(self, sync_engine, sync_session):
        """Total user_achievements count should match expected range."""
        user_ids = _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        total = sync_session.execute(text("SELECT COUNT(*) FROM user_achievements")).scalar()
        # Each of 10 users gets 2-5 achievements => 20-50 total
        assert total >= 20
        assert total <= 50

    def test_assigns_challenges_to_users(self, sync_engine, sync_session):
        """Total user_challenges count should match expected range."""
        user_ids = _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        total = sync_session.execute(text("SELECT COUNT(*) FROM user_challenges")).scalar()
        # Each of 10 users joins 1-3 challenges => 10-30 total
        assert total >= 10
        assert total <= 30

    def test_leaderboard_created(self, sync_engine, sync_session):
        """Leaderboard should have entries for all users."""
        user_ids = _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        count = sync_session.execute(text("SELECT COUNT(*) FROM leaderboard")).scalar()
        assert count == len(user_ids)

    def test_leaderboard_ranks_unique(self, sync_engine, sync_session):
        """Leaderboard ranks should be unique within a period."""
        _create_test_users(sync_engine, n=10)
        seed_gamification(sync_engine)

        total = sync_session.execute(text("SELECT COUNT(*) FROM leaderboard")).scalar()
        unique_ranks = sync_session.execute(
            text("SELECT COUNT(DISTINCT rank) FROM leaderboard WHERE period = '2025-04'")
        ).scalar()
        assert total == unique_ranks

    def test_user_xp_and_levels_set(self, sync_engine, sync_session):
        """All user profiles should have XP > 0 and level >= 1 after seeding."""
        _create_test_users(sync_engine, n=10)
        seed_gamification(sync_engine)

        rows = sync_session.execute(text("SELECT xp, level FROM user_profiles")).fetchall()
        for xp, level in rows:
            assert xp > 0
            assert level >= 1

    def test_challenge_progress_bounded(self, sync_engine, sync_session):
        """Challenge progress should be between 0 and 100."""
        _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        rows = sync_session.execute(text("SELECT progress FROM user_challenges")).fetchall()
        for (progress,) in rows:
            assert 0 <= progress <= 100.0

    def test_achievement_ids_match(self, sync_engine, sync_session):
        """Achievement IDs in DB should match defined constants."""
        _create_test_users(sync_engine)
        seed_gamification(sync_engine)

        rows = sync_session.execute(text("SELECT id FROM achievements")).fetchall()
        db_ids = {row[0] for row in rows}
        expected_ids = {a["id"] for a in ACHIEVEMENTS}
        assert db_ids == expected_ids

    def test_idempotent(self, sync_engine, sync_session):
        """Running twice should not duplicate achievements/challenges."""
        _create_test_users(sync_engine)
        seed_gamification(sync_engine)
        seed_gamification(sync_engine)

        ach_count = sync_session.execute(text("SELECT COUNT(*) FROM achievements")).scalar()
        assert ach_count == len(ACHIEVEMENTS)

        ch_count = sync_session.execute(text("SELECT COUNT(*) FROM challenges")).scalar()
        assert ch_count == len(CHALLENGES)
