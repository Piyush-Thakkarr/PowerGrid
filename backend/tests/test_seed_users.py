"""Tests for seed_users.py"""

import pytest
from sqlalchemy import text
from tests.conftest_seed import sync_engine, sync_session  # noqa: F401

from app.seed.seed_users import seed_users, INDIAN_STATES


class TestSeedUsers:
    """Test user seeding logic."""

    def test_creates_50_users(self, sync_engine, sync_session):
        """Should create exactly 50 users."""
        ids = seed_users(sync_engine)
        assert len(ids) == 50

        count = sync_session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        assert count == 50

    def test_creates_profiles_for_all_users(self, sync_engine, sync_session):
        """Every user should have a profile."""
        seed_users(sync_engine)

        user_count = sync_session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        profile_count = sync_session.execute(text("SELECT COUNT(*) FROM user_profiles")).scalar()
        assert user_count == profile_count == 50

    def test_demo_users_exist(self, sync_engine, sync_session):
        """Demo users should have correct emails and states."""
        seed_users(sync_engine)

        demo1 = sync_session.execute(
            text("SELECT u.email, p.state FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.email = :e"),
            {"e": "demo@powergrid.in"},
        ).fetchone()
        assert demo1 is not None
        assert demo1[1] == "Gujarat"

        demo2 = sync_session.execute(
            text("SELECT u.email, p.state FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.email = :e"),
            {"e": "demo2@powergrid.in"},
        ).fetchone()
        assert demo2 is not None
        assert demo2[1] == "Maharashtra"

    def test_all_28_states_covered(self, sync_engine, sync_session):
        """At least 28 distinct states should be represented."""
        seed_users(sync_engine)

        rows = sync_session.execute(text("SELECT DISTINCT state FROM user_profiles")).fetchall()
        states = {row[0] for row in rows}
        assert len(states) >= 28
        for s in INDIAN_STATES:
            assert s in states

    def test_household_sizes_in_range(self, sync_engine, sync_session):
        """All household sizes should be between 1 and 8."""
        seed_users(sync_engine)

        rows = sync_session.execute(text("SELECT household_size FROM user_profiles")).fetchall()
        for row in rows:
            assert 1 <= row[0] <= 8

    def test_idempotent_reseed(self, sync_engine, sync_session):
        """Running seed_users twice should not duplicate users."""
        ids1 = seed_users(sync_engine)
        ids2 = seed_users(sync_engine)

        count = sync_session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        assert count == 50
        assert len(ids1) == len(ids2) == 50

    def test_unique_emails(self, sync_engine, sync_session):
        """All emails should be unique."""
        seed_users(sync_engine)

        total = sync_session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        unique = sync_session.execute(text("SELECT COUNT(DISTINCT email) FROM users")).scalar()
        assert total == unique

    def test_discom_assigned(self, sync_engine, sync_session):
        """Every profile should have a discom assigned."""
        seed_users(sync_engine)

        rows = sync_session.execute(text("SELECT discom FROM user_profiles")).fetchall()
        for row in rows:
            assert row[0] is not None
            assert len(row[0]) > 0
