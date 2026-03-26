"""Tests for profile API — uses fresh async engine per test."""
import pytest
import jwt
import uuid
from datetime import datetime, timezone, timedelta

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import get_settings
from app.database import get_db

TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests-only"


def make_token(user_id: str = None) -> str:
    if user_id is None:
        user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "iss": "supabase",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "role": "authenticated",
        "email": "profile@example.com",
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    from app.main import app as fastapi_app
    from app.database import Base
    from app.models.user import User, UserProfile  # register models

    # Use SQLite for these tests (no PG-specific SQL)
    test_engine = create_async_engine("sqlite+aiosqlite:///./test_profile.db", echo=False)
    test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with test_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    fastapi_app.dependency_overrides[get_db] = override_get_db

    import os
    os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET
    get_settings.cache_clear()

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()

    # Clean up
    import pathlib
    pathlib.Path("test_profile.db").unlink(missing_ok=True)


@pytest.mark.anyio
async def test_get_profile_returns_user(client):
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id


@pytest.mark.anyio
async def test_update_profile_changes_fields(client):
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated Name", "householdSize": 6, "state": "Maharashtra", "tariffPlan": "Commercial"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["householdSize"] == 6
    assert data["state"] == "Maharashtra"


@pytest.mark.anyio
async def test_update_profile_invalid_state_rejected(client):
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"state": "Narnia"},
    )
    assert response.status_code in (422, 400)


@pytest.mark.anyio
async def test_update_persists_across_requests(client):
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Persistent Name", "householdSize": 3},
    )

    response = await client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    data = response.json()
    assert data["name"] == "Persistent Name"
    assert data["householdSize"] == 3


@pytest.mark.anyio
async def test_profile_without_auth_returns_error(client):
    response = await client.get("/api/profile")
    assert response.status_code in (401, 403)
