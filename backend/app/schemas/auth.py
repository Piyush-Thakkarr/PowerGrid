from pydantic import BaseModel
from typing import Optional


class UserResponse(BaseModel):
    """User response matching frontend's expected camelCase format."""
    id: str
    email: str
    phone: Optional[str] = None
    name: str
    householdSize: int
    state: str
    tariffPlan: str
    xp: int
    level: int
    createdAt: str
    avatarUrl: Optional[str] = None
    provider: Optional[str] = None
