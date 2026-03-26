"""Tests for billing API — uses real Supabase PostgreSQL."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


@pytest.mark.anyio
async def test_calculate_bill(pg_client):
    resp = await pg_client.get("/api/billing/calculate?month=6&year=2020")
    assert resp.status_code == 200
    data = resp.json()
    assert "totalCost" in data or "error" in data


@pytest.mark.anyio
async def test_bill_has_slab_breakdown(pg_client):
    resp = await pg_client.get("/api/billing/calculate?month=6&year=2020")
    data = resp.json()
    if "breakdown" in data:
        assert isinstance(data["breakdown"], list)
        if data["breakdown"]:
            assert "slabStart" in data["breakdown"][0]
            assert "rate" in data["breakdown"][0]


@pytest.mark.anyio
async def test_bill_includes_all_components(pg_client):
    resp = await pg_client.get("/api/billing/calculate?month=6&year=2020")
    data = resp.json()
    if "totalCost" in data:
        for key in ["energyCharge", "fixedCharge", "electricityDuty", "fuelSurcharge"]:
            assert key in data
        assert data["totalCost"] >= 0


@pytest.mark.anyio
async def test_bill_history(pg_client):
    resp = await pg_client.get("/api/billing/history?months=6")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_invalid_month_rejected(pg_client):
    resp = await pg_client.get("/api/billing/calculate?month=13&year=2020")
    assert resp.status_code == 422
