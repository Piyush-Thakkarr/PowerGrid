import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserProfile
from app.schemas.auth import UserResponse


async def get_or_create_user(
    db: AsyncSession,
    user_id: str,
    email: str = "",
    provider: str = "email",
) -> User:
    """Find user by Supabase ID, or create if first time."""
    uid = uuid.UUID(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=uid,
            email=email,
            name=email.split("@")[0] if email else "",
            provider=provider,
        )
        db.add(user)
        await db.flush()

        profile = UserProfile(user_id=uid)
        db.add(profile)
        await db.flush()

        # Re-fetch with profile loaded
        result = await db.execute(select(User).where(User.id == uid))
        user = result.scalar_one()

    return user


def user_to_response(user: User, profile: UserProfile) -> UserResponse:
    """Convert DB models to frontend-compatible camelCase response."""
    return UserResponse(
        id=str(user.id),
        email=user.email or "",
        phone=user.phone,
        name=user.name or "",
        householdSize=profile.household_size if profile else 4,
        state=profile.state if profile else "Gujarat",
        tariffPlan=profile.tariff_plan if profile else "Residential",
        xp=profile.xp if profile else 0,
        level=profile.level if profile else 1,
        createdAt=user.created_at.isoformat() if user.created_at else "",
        avatarUrl=profile.avatar_url if profile else None,
        provider=user.provider,
    )
