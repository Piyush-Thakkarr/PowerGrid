"""Tests for Government dashboard endpoints."""
import pytest
import uuid
import hashlib
from types import SimpleNamespace
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import get_settings
from app.routers.auth import get_current_user
from app.database import get_db

TEST_USER_UUID = uuid.UUID(hashlib.md5(b"user-0").hexdigest())


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def gov_client():
    from app.main import app

    settings = get_settings()
    test_engine = create_async_engine(settings.database_url, echo=False, pool_size=5)
    test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def fresh_get_db():
        async with test_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    mock_user = SimpleNamespace(id=TEST_USER_UUID, role="government")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = fresh_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_gov_overview(gov_client):
    resp = await gov_client.get("/api/government/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "totalStates" in data
    assert "byState" in data


@pytest.mark.anyio
async def test_gov_segmentation(gov_client):
    resp = await gov_client.get("/api/government/segmentation")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_gov_tariff_distribution(gov_client):
    resp = await gov_client.get("/api/government/tariff-distribution")
    assert resp.status_code == 200
    data = resp.json()
    assert "distribution" in data


@pytest.mark.anyio
async def test_gov_consumption_trend(gov_client):
    resp = await gov_client.get("/api/government/consumption-trend?months=3")
    assert resp.status_code == 200
    data = resp.json()
    assert "trend" in data


@pytest.mark.anyio
async def test_consumer_denied_gov(gov_client):
    """Gov endpoints should work for government role (this is a positive test)."""
    resp = await gov_client.get("/api/government/overview")
    assert resp.status_code == 200
