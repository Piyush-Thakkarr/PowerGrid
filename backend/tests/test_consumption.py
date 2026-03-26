"""Tests for consumption API — uses real Supabase PostgreSQL."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


@pytest.mark.anyio
async def test_stats_endpoint(pg_client):
    resp = await pg_client.get("/api/consumption/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "thisMonthKwh" in data
    assert "lastMonthKwh" in data
    assert "monthChangePercent" in data


@pytest.mark.anyio
async def test_monthly_returns_list(pg_client):
    resp = await pg_client.get("/api/consumption/monthly?months=6")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        assert "month" in data[0]
        assert "kwh" in data[0]


@pytest.mark.anyio
async def test_heatmap_returns_list(pg_client):
    resp = await pg_client.get("/api/consumption/heatmap?days=30")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_live_endpoint(pg_client):
    resp = await pg_client.get("/api/consumption/live")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_daily_with_date_range(pg_client):
    resp = await pg_client.get("/api/consumption/daily?start=2020-01-01&end=2020-06-30")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_hourly_with_date(pg_client):
    resp = await pg_client.get("/api/consumption/hourly?date=2020-06-15")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
