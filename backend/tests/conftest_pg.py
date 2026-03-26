"""Shared fixtures for tests that need real PostgreSQL."""
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
async def pg_client():
    """Client with fresh async engine per test to avoid event loop issues."""
    from app.main import app

    # Create a fresh engine for this test's event loop
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

    mock_user = SimpleNamespace(id=TEST_USER_UUID)
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = fresh_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await test_engine.dispose()
