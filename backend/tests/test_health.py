import pytest


@pytest.mark.asyncio
async def test_health_endpoint_returns_200(client):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_response_has_status(client):
    response = await client.get("/health")
    data = response.json()
    assert "status" in data
    assert "database" in data
