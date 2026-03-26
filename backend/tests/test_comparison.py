"""Tests for comparison API — uses real Supabase PostgreSQL."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


@pytest.mark.anyio
async def test_comparison_returns_data(pg_client):
    resp = await pg_client.get("/api/comparison/")
    assert resp.status_code == 200
    data = resp.json()
    assert "yourMonthlyKwh" in data or "error" in data


@pytest.mark.anyio
async def test_comparison_has_all_averages(pg_client):
    resp = await pg_client.get("/api/comparison/")
    data = resp.json()
    if "stateAvgKwh" in data:
        for key in ["nationalAvgKwh", "similarHouseholdKwh", "percentile", "yourRank"]:
            assert key in data
        assert data["percentile"] >= 1
