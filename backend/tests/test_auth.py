import pytest
import jwt
import uuid
from datetime import datetime, timezone, timedelta

# Test JWT secret matching conftest override
TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests-only"


def make_token(user_id: str = None, expired: bool = False, audience: str = "authenticated") -> str:
    """Create a Supabase-style JWT for testing."""
    if user_id is None:
        user_id = str(uuid.uuid4())

    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "aud": audience,
        "iss": "supabase",
        "iat": int(now.timestamp()),
        "exp": int((now - timedelta(hours=1) if expired else now + timedelta(hours=1)).timestamp()),
        "role": "authenticated",
        "email": "test@example.com",
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.mark.asyncio
async def test_missing_token_returns_error(client):
    """Request without Authorization header should be rejected."""
    response = await client.get("/api/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_invalid_token_returns_401(client):
    """Garbage token should be rejected."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer garbage.invalid.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expired_token_returns_401(client):
    """Expired JWT should be rejected."""
    token = make_token(expired=True)
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_valid_token_creates_user_and_returns_profile(client):
    """First-time user with valid token should be auto-created in DB."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_second_call_returns_same_user(client):
    """Second call with same token should return the same user, not duplicate."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)

    r1 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    r2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


@pytest.mark.asyncio
async def test_response_uses_camelcase(client):
    """API response must use camelCase field names for frontend compatibility."""
    token = make_token()
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = response.json()
    # camelCase fields that frontend expects
    assert "householdSize" in data
    assert "tariffPlan" in data
    assert "createdAt" in data
    assert "avatarUrl" in data
    # snake_case should NOT be present
    assert "household_size" not in data
    assert "tariff_plan" not in data
    assert "created_at" not in data
