"""Tests for gamification API — uses real Supabase PostgreSQL."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


@pytest.mark.anyio
async def test_achievements_endpoint(pg_client):
    resp = await pg_client.get("/api/gamification/achievements")
    assert resp.status_code == 200
    data = resp.json()
    assert "achievements" in data
    assert data["totalAvailable"] >= 12


@pytest.mark.anyio
async def test_challenges_endpoint(pg_client):
    resp = await pg_client.get("/api/gamification/challenges")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_leaderboard_endpoint(pg_client):
    resp = await pg_client.get("/api/gamification/leaderboard")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_xp_endpoint(pg_client):
    resp = await pg_client.get("/api/gamification/xp")
    assert resp.status_code == 200
    data = resp.json()
    assert "xp" in data
    assert "level" in data
    assert "progress" in data
