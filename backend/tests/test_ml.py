"""Tests for ML endpoints — 6 pipelines."""
import pytest
from tests.conftest_pg import pg_client, anyio_backend  # noqa: F401


# ── Pipeline 1: Forecast (Extra Trees) ──────────────
@pytest.mark.anyio
async def test_forecast(pg_client):
    resp = await pg_client.get("/api/ml/forecast?horizon=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model"] == "extra_trees"
    if "predictions" in data:
        assert len(data["predictions"]) == 3
        assert "predicted" in data["predictions"][0]
        assert "date" in data["predictions"][0]
    if "topFeatures" in data:
        assert len(data["topFeatures"]) <= 5


@pytest.mark.anyio
async def test_forecast_custom_horizon(pg_client):
    resp = await pg_client.get("/api/ml/forecast?horizon=14")
    assert resp.status_code == 200
    data = resp.json()
    if "predictions" in data:
        assert len(data["predictions"]) == 14


# ── Pipeline 2: Anomaly Detection (STL + Z-score) ──
@pytest.mark.anyio
async def test_anomaly_detection(pg_client):
    resp = await pg_client.get("/api/ml/anomalies?threshold=2.0")
    assert resp.status_code == 200
    data = resp.json()
    assert "anomalies" in data
    if "anomalyCount" in data:
        assert isinstance(data["anomalyCount"], int)
    if "decomposition" in data:
        d = data["decomposition"]
        assert "dates" in d
        assert "trend" in d
        assert "seasonal" in d
        assert "residual" in d
        assert len(d["dates"]) == len(d["trend"])
    if data.get("anomalies"):
        a = data["anomalies"][0]
        assert "date" in a
        assert "actual" in a
        assert "severity" in a
        assert "zScore" in a


# ── Pipeline 3: Segmentation (GMM) ─────────────────
@pytest.mark.anyio
async def test_segmentation(pg_client):
    resp = await pg_client.get("/api/ml/segmentation?clusters=3")
    assert resp.status_code == 200
    data = resp.json()
    if "clusters" in data:
        assert len(data["clusters"]) == 3
        for c in data["clusters"]:
            assert "clusterId" in c
            assert "userCount" in c
            assert "peakHour" in c
            assert "hourlyProfile" in c


@pytest.mark.anyio
async def test_my_segment(pg_client):
    resp = await pg_client.get("/api/ml/segmentation/me")
    assert resp.status_code == 200


# ── Pipeline 4: Demand Response (Gradient Boosting) ─
@pytest.mark.anyio
async def test_demand_response(pg_client):
    resp = await pg_client.get("/api/ml/demand-response?hours=12")
    assert resp.status_code == 200
    data = resp.json()
    if "predictions" in data:
        assert len(data["predictions"]) == 12
        p = data["predictions"][0]
        assert "hour" in p
        assert "isPeak" in p
        assert "peakProbability" in p


# ── Pipeline 5: Tariff Optimizer ────────────────────
@pytest.mark.anyio
async def test_tariff_optimizer(pg_client):
    resp = await pg_client.get("/api/ml/tariff-optimizer")
    assert resp.status_code == 200
    data = resp.json()
    if "allPlans" in data:
        assert "recommendedPlan" in data
        assert "monthlySavings" in data
        assert "monthlyKwh" in data


# ── Pipeline 6: NILM Disaggregation ────────────────
@pytest.mark.anyio
async def test_nilm(pg_client):
    resp = await pg_client.get("/api/ml/nilm?days=30")
    assert resp.status_code == 200
    data = resp.json()
    if "breakdown" in data:
        assert "totalKwh" in data
        for item in data["breakdown"]:
            assert "appliance" in item
            assert "estimatedKwh" in item
            assert "percentage" in item
    if "nmfComponents" in data:
        for comp in data["nmfComponents"]:
            assert "componentId" in comp
            assert "hourlyProfile" in comp


# ── Recommendations ────────────────────────────────
@pytest.mark.anyio
async def test_recommendations(pg_client):
    resp = await pg_client.get("/api/ml/recommendations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    if data:
        assert "title" in data[0]
        assert "estimatedSavings" in data[0]
        assert "priority" in data[0]
