"""Tests for ML endpoints — uses real Supabase PostgreSQL."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


@pytest.mark.anyio
async def test_neural_forecast(pg_client):
    resp = await pg_client.get("/api/ml/forecast/neural?horizon=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "neural"
    if "predictions" in data:
        assert len(data["predictions"]) == 3


@pytest.mark.anyio
async def test_sarima_forecast(pg_client):
    resp = await pg_client.get("/api/ml/forecast/sarima?horizon=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "sarima"
    if "predictions" in data:
        assert len(data["predictions"]) == 3
        assert "predicted" in data["predictions"][0]
        assert "date" in data["predictions"][0]


@pytest.mark.anyio
async def test_prophet_forecast(pg_client):
    resp = await pg_client.get("/api/ml/forecast/prophet?horizon=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "prophet"
    if "predictions" in data:
        assert len(data["predictions"]) == 3


@pytest.mark.anyio
async def test_forecast_compare(pg_client):
    resp = await pg_client.get("/api/ml/forecast/compare?horizon=3")
    assert resp.status_code == 200
    data = resp.json()
    assert "sarima" in data
    assert "prophet" in data
    assert "bestModel" in data


@pytest.mark.anyio
async def test_anomaly_detection(pg_client):
    resp = await pg_client.get("/api/ml/anomalies?sensitivity=0.05")
    assert resp.status_code == 200
    data = resp.json()
    assert "anomalies" in data
    if "anomalyCount" in data:
        if data["anomalies"]:
            a = data["anomalies"][0]
            assert "date" in a
            assert "actual" in a
            assert "severity" in a


@pytest.mark.anyio
async def test_decomposition(pg_client):
    resp = await pg_client.get("/api/ml/decomposition")
    assert resp.status_code == 200
    data = resp.json()
    if "dates" in data:
        assert "trend" in data
        assert "seasonal" in data
        assert "residual" in data
        assert len(data["dates"]) == len(data["trend"])


@pytest.mark.anyio
async def test_peak_hours(pg_client):
    resp = await pg_client.get("/api/ml/peak-hours?days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert "peakHours" in data
    assert "offPeakHours" in data
    assert "hourlyProfile" in data


@pytest.mark.anyio
async def test_recommendations(pg_client):
    resp = await pg_client.get("/api/ml/recommendations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # at least the 2 general tips
    if data:
        assert "title" in data[0]
        assert "estimatedSavings" in data[0]
        assert "priority" in data[0]
