"""Request/response schemas."""

from pydantic import BaseModel, field_validator
from typing import Optional

VALID_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal",
]

VALID_TARIFF_PLANS = ["Residential", "Commercial", "Industrial"]


class UserResponse(BaseModel):
    id: str
    email: str
    phone: Optional[str] = None
    name: str
    role: str = "consumer"
    householdSize: int
    state: str
    tariffPlan: str
    xp: int
    level: int
    createdAt: str
    avatarUrl: Optional[str] = None
    provider: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    householdSize: Optional[int] = None
    state: Optional[str] = None
    tariffPlan: Optional[str] = None
    discom: Optional[str] = None

    @field_validator("state")
    @classmethod
    def validate_state(cls, v):
        if v is not None and v not in VALID_STATES:
            raise ValueError(f"Invalid state. Must be one of: {', '.join(VALID_STATES)}")
        return v

    @field_validator("tariffPlan")
    @classmethod
    def validate_tariff(cls, v):
        if v is not None and v not in VALID_TARIFF_PLANS:
            raise ValueError(f"Invalid tariff plan. Must be one of: {', '.join(VALID_TARIFF_PLANS)}")
        return v

    @field_validator("householdSize")
    @classmethod
    def validate_household_size(cls, v):
        if v is not None and (v < 1 or v > 20):
            raise ValueError("Household size must be between 1 and 20")
        return v
