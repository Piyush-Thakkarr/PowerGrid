import jwt as pyjwt
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.user import User, UserProfile
from app.services.auth_service import get_or_create_user, user_to_response
from app.schemas.auth import UserResponse
from app.schemas.profile import ProfileUpdateRequest

router = APIRouter()
security = HTTPBearer()


def decode_token(token: str) -> dict:
    from app.routers.auth import decode_supabase_token
    return decode_supabase_token(token)


@router.get("", response_model=UserResponse)
async def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(credentials.credentials)
    user_id = payload["sub"]

    user = await get_or_create_user(db, user_id, payload.get("email", ""))
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    return user_to_response(user, profile)


@router.put("", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(credentials.credentials)
    user_id = payload["sub"]
    uid = uuid.UUID(user_id)

    # Ensure user exists
    user = await get_or_create_user(db, user_id, payload.get("email", ""))

    # Update user fields
    if body.name is not None:
        user.name = body.name

    # Update profile fields
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == uid))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = UserProfile(user_id=uid)
        db.add(profile)

    if body.householdSize is not None:
        profile.household_size = body.householdSize
    if body.state is not None:
        profile.state = body.state
    if body.tariffPlan is not None:
        profile.tariff_plan = body.tariffPlan
    if body.discom is not None:
        profile.discom = body.discom

    await db.flush()

    return user_to_response(user, profile)
