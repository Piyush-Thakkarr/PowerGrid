import pytest
import jwt
import uuid
from datetime import datetime, timezone, timedelta

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


@pytest.mark.asyncio
async def test_get_profile_returns_user(client):
    """GET /api/profile should return user data."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)

    # First call creates user
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.get(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == user_id


@pytest.mark.asyncio
async def test_update_profile_changes_fields(client):
    """PUT /api/profile should update and return new values."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)

    # Create user first
    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Name",
            "householdSize": 6,
            "state": "Maharashtra",
            "tariffPlan": "Commercial",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["householdSize"] == 6
    assert data["state"] == "Maharashtra"
    assert data["tariffPlan"] == "Commercial"


@pytest.mark.asyncio
async def test_update_profile_invalid_state_rejected(client):
    """Updating with an invalid state should be rejected."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)

    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    response = await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"state": "Narnia"},
    )
    assert response.status_code == 422 or response.status_code == 400


@pytest.mark.asyncio
async def test_update_persists_across_requests(client):
    """Updated profile should persist when fetched again."""
    user_id = str(uuid.uuid4())
    token = make_token(user_id=user_id)

    await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    await client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Persistent Name", "householdSize": 3},
    )

    response = await client.get(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = response.json()
    assert data["name"] == "Persistent Name"
    assert data["householdSize"] == 3


@pytest.mark.asyncio
async def test_profile_without_auth_returns_error(client):
    """Profile endpoint without token should fail."""
    response = await client.get("/api/profile")
    assert response.status_code in (401, 403)
