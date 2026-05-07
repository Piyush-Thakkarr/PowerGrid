"""Auth + Profile endpoints — Clerk JWT verification."""

import json
import urllib.request

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings
from app.database import fetchrow, execute
from app.services.auth_service import get_or_create_user, user_to_response
from app.schemas import UserResponse, ProfileUpdateRequest

router = APIRouter()
security = HTTPBearer()

_jwks_cache: dict = {}


def _get_clerk_jwks():
    """Fetch Clerk's JWKS public keys for JWT verification."""
    import time
    if _jwks_cache.get("keys") and (time.time() - _jwks_cache.get("ts", 0)) < 3600:
        return _jwks_cache["keys"]
    settings = get_settings()
    try:
        # Clerk JWKS endpoint
        jwks_url = f"https://{settings.clerk_domain}/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url, timeout=5) as resp:
            jwks = json.loads(resp.read())
        _jwks_cache["keys"] = jwks["keys"]
        _jwks_cache["ts"] = time.time()
        return jwks["keys"]
    except Exception:
        return _jwks_cache.get("keys")


def decode_token(token: str) -> dict:
    """Decode and verify a Clerk JWT."""
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    jwks_keys = _get_clerk_jwks()
    if not jwks_keys:
        raise HTTPException(status_code=503, detail="Auth service unavailable")

    kid = header.get("kid")
    key_data = next((k for k in jwks_keys if k.get("kid") == kid), None)
    if not key_data:
        raise HTTPException(status_code=401, detail="Unknown signing key")

    try:
        public_key = pyjwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
        payload = pyjwt.decode(token, public_key, algorithms=["RS256"])
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing sub in token")

    # Clerk JWT may not include email — try multiple locations
    email = ""
    for key in ["email", "primary_email_address", "email_address"]:
        if payload.get(key):
            email = payload[key]
            break

    # If still no email, fetch from Clerk API
    if not email:
        try:
            settings = get_settings()
            import urllib.request
            req = urllib.request.Request(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                import json
                clerk_user = json.loads(resp.read())
                addrs = clerk_user.get("email_addresses", [])
                if addrs:
                    email = addrs[0].get("email_address", "")
        except Exception:
            pass

    return await get_or_create_user(user_id, email)


def require_role(*roles: str):
    async def checker(user=Depends(get_current_user)):
        if user.get("role", "consumer") not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(roles)}")
        return user
    return checker


# ---- Auth endpoints ----

@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    profile = await fetchrow("SELECT * FROM user_profiles WHERE user_id = $1", user["id"])
    return user_to_response(user, profile)


# ---- Profile endpoints ----

@router.get("/profile", response_model=UserResponse)
async def get_profile(user=Depends(get_current_user)):
    profile = await fetchrow("SELECT * FROM user_profiles WHERE user_id = $1", user["id"])
    return user_to_response(user, profile)


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: ProfileUpdateRequest, user=Depends(get_current_user)):
    profile = await fetchrow("SELECT * FROM user_profiles WHERE user_id = $1", user["id"])

    if profile is None:
        await execute("INSERT INTO user_profiles (user_id) VALUES ($1)", user["id"])

    updates, params = [], [user["id"]]
    idx = 2
    if body.name is not None:
        await execute("UPDATE users SET name = $1 WHERE id = $2", body.name, user["id"])
    if body.householdSize is not None:
        updates.append(f"household_size = ${idx}"); params.append(body.householdSize); idx += 1
    if body.state is not None:
        updates.append(f"state = ${idx}"); params.append(body.state); idx += 1
    if body.tariffPlan is not None:
        updates.append(f"tariff_plan = ${idx}"); params.append(body.tariffPlan); idx += 1

    if updates:
        await execute(f"UPDATE user_profiles SET {', '.join(updates)} WHERE user_id = $1", *params)

    from app.services.ml_cache import clear_user_cache
    clear_user_cache(user["id"])

    user = await fetchrow("SELECT * FROM users WHERE id = $1", user["id"])
    profile = await fetchrow("SELECT * FROM user_profiles WHERE user_id = $1", user["id"])
    return user_to_response(user, profile)
