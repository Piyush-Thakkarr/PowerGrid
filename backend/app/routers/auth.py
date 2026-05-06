"""Auth + Profile endpoints."""

import json
import os
import urllib.request
import uuid as uuid_mod

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.user import User, UserProfile
from app.services.auth_service import get_or_create_user, user_to_response
from app.schemas import UserResponse
from app.schemas import ProfileUpdateRequest

router = APIRouter()
security = HTTPBearer()

_jwks_cache: dict[str, tuple] = {}
_JWKS_TTL = 3600


def _get_jwks_key(supabase_url: str):
    import time
    cached = _jwks_cache.get(supabase_url)
    if cached and (time.time() - cached[1]) < _JWKS_TTL:
        return cached[0]
    try:
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url, timeout=5) as resp:
            jwks = json.loads(resp.read())
        key = pyjwt.algorithms.ECAlgorithm.from_jwk(json.dumps(jwks["keys"][0]))
        _jwks_cache[supabase_url] = (key, time.time())
        return key
    except Exception:
        if cached:
            return cached[0]
        return None


def decode_supabase_token(token: str) -> dict:
    settings = get_settings()
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    try:
        if header.get("alg") == "ES256":
            supabase_url = os.environ.get("SUPABASE_URL", "https://aihjvcqxfesivapwwqkk.supabase.co")
            key = _get_jwks_key(supabase_url)
            if key is None:
                raise HTTPException(status_code=503, detail="Auth service unavailable — cannot verify token")
            payload = pyjwt.decode(token, key, algorithms=["ES256"], audience="authenticated")
        else:
            payload = pyjwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing sub in token")
    return await get_or_create_user(db, user_id, email)


VALID_ROLES = {"consumer", "discom", "government", "grid_operator"}


def require_role(*roles: str):
    """Dependency that checks user has one of the required roles."""
    async def checker(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(roles)}")
        return user
    return checker


# ---- Auth endpoints ----

@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    return user_to_response(user, profile)


# ---- Profile endpoints ----

@router.get("/profile", response_model=UserResponse)
async def get_profile(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    return user_to_response(user, profile)


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: ProfileUpdateRequest, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    if body.name is not None:
        user.name = body.name
    if body.householdSize is not None:
        profile.household_size = body.householdSize
    if body.state is not None:
        profile.state = body.state
    if body.tariffPlan is not None:
        profile.tariff_plan = body.tariffPlan
    if body.discom is not None:
        profile.discom = body.discom

    await db.flush()

    from app.services.ml_cache import clear_user_cache
    clear_user_cache(user.id)

    return user_to_response(user, profile)


# ---- Admin: Role management ----

@router.put("/assign-role")
async def assign_role(
    target_user_id: str,
    role: str,
    user=Depends(require_role("government")),
    db: AsyncSession = Depends(get_db),
):
    if role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
    import uuid
    try:
        uid = uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user ID")
    target = await db.execute(select(User).where(User.id == uid))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    target_user.role = role
    await db.flush()
    return {"userId": str(uid), "role": role}
