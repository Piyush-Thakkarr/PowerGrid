"""Tests for DISCOM dashboard endpoints."""
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
async def discom_client():
    """Client with a discom-role user."""
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

    mock_user = SimpleNamespace(id=TEST_USER_UUID, role="discom")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = fresh_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.fixture
async def consumer_client():
    """Client with a consumer-role user (should be denied)."""
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

    mock_user = SimpleNamespace(id=TEST_USER_UUID, role="consumer")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = fresh_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.anyio
async def test_discom_overview(discom_client):
    resp = await discom_client.get("/api/discom/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "totalConsumers" in data
    assert "totalKwh30d" in data


@pytest.mark.anyio
async def test_discom_segmentation(discom_client):
    resp = await discom_client.get("/api/discom/segmentation")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_discom_demand(discom_client):
    resp = await discom_client.get("/api/discom/demand?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert "demandCurve" in data


@pytest.mark.anyio
async def test_discom_revenue(discom_client):
    resp = await discom_client.get("/api/discom/revenue")
    assert resp.status_code == 200
    data = resp.json()
    assert "byPlan" in data


@pytest.mark.anyio
async def test_consumer_denied_discom(consumer_client):
    resp = await consumer_client.get("/api/discom/overview")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_consumer_denied_revenue(consumer_client):
    resp = await consumer_client.get("/api/discom/revenue")
    assert resp.status_code == 403
