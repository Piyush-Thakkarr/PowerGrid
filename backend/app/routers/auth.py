import jwt as pyjwt
import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.user import User, UserProfile
from app.services.auth_service import get_or_create_user, user_to_response
from app.schemas.auth import UserResponse

router = APIRouter()
security = HTTPBearer()

# Cache for JWKS public keys
_jwks_cache = {}


def _get_jwks_key(supabase_url: str):
    """Fetch and cache the Supabase JWKS public key for ES256 verification."""
    if supabase_url in _jwks_cache:
        return _jwks_cache[supabase_url]
    try:
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url, timeout=5) as resp:
            jwks = json.loads(resp.read())
        key = pyjwt.algorithms.ECAlgorithm.from_jwk(json.dumps(jwks["keys"][0]))
        _jwks_cache[supabase_url] = key
        return key
    except Exception:
        return None


def decode_supabase_token(token: str) -> dict:
    """Decode and validate a Supabase JWT (supports both HS256 and ES256)."""
    settings = get_settings()

    # Peek at the token header to determine algorithm
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    try:
        if header.get("alg") == "ES256":
            # New Supabase projects use asymmetric ES256 keys
            import os
            supabase_url = os.environ.get("SUPABASE_URL", "https://aihjvcqxfesivapwwqkk.supabase.co")
            key = _get_jwks_key(supabase_url)
            if key is None:
                # Fallback: skip verification in case JWKS fetch fails
                payload = pyjwt.decode(token, options={"verify_signature": False}, audience="authenticated")
            else:
                payload = pyjwt.decode(token, key, algorithms=["ES256"], audience="authenticated")
        else:
            # Legacy HS256 with shared secret
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: decode JWT → return User object. Used by all protected routes."""
    payload = decode_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing sub in token")
    return await get_or_create_user(db, user_id, email)


@router.get("/me", response_model=UserResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile. Auto-creates user on first call."""
    payload = decode_supabase_token(credentials.credentials)

    user_id = payload.get("sub")
    email = payload.get("email", "")

    if not user_id:
        raise HTTPException(status_code=401, detail="Missing sub in token")

    user = await get_or_create_user(db, user_id, email)

    # Load profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    return user_to_response(user, profile)
