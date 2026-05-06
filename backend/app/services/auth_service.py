"""Auth service — user management with domain-based role assignment."""

import uuid
import hashlib
from app.database import fetchrow, execute
from app.schemas import UserResponse


async def _resolve_role(email: str) -> tuple[str, str | None]:
    """Determine role and state from email domain.

    Checks domain_roles table first, then falls back to .gov.in/.nic.in pattern.
    """
    if not email or "@" not in email:
        return "consumer", None

    domain = email.split("@")[1].lower()

    row = await fetchrow("SELECT role, state FROM domain_roles WHERE domain = $1", domain)
    if row:
        return row["role"], row["state"]

    if domain.endswith(".gov.in") or domain.endswith(".nic.in"):
        return "government", None

    return "consumer", None


async def get_or_create_user(user_id: str, email: str = "", provider: str = "email"):
    uid = uuid.UUID(hashlib.md5(user_id.encode()).hexdigest())
    row = await fetchrow("SELECT * FROM users WHERE id = $1", uid)

    if row is None:
        name = email.split("@")[0] if email else ""
        role, state = await _resolve_role(email)

        await execute(
            "INSERT INTO users (id, email, name, role, provider) VALUES ($1, $2, $3, $4, $5)",
            uid, email, name, role, provider,
        )

        if state:
            await execute(
                "INSERT INTO user_profiles (user_id, state) VALUES ($1, $2)", uid, state,
            )
        else:
            await execute("INSERT INTO user_profiles (user_id) VALUES ($1)", uid)

        row = await fetchrow("SELECT * FROM users WHERE id = $1", uid)

    return row


def user_to_response(user, profile) -> UserResponse:
    return UserResponse(
        id=str(user["id"]),
        email=user["email"] or "",
        phone=user.get("phone"),
        name=user["name"] or "",
        role=user.get("role") or "consumer",
        householdSize=(profile["household_size"] or 4) if profile else 4,
        state=(profile["state"] or "Gujarat") if profile else "Gujarat",
        tariffPlan=(profile["tariff_plan"] or "Residential") if profile else "Residential",
        xp=(profile["xp"] or 0) if profile else 0,
        level=(profile["level"] or 1) if profile else 1,
        createdAt=user["created_at"].isoformat() if user.get("created_at") else "",
        avatarUrl=profile.get("avatar_url") if profile else None,
        provider=user.get("provider"),
    )
