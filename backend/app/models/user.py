import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, default="")
    phone = Column(String(20), nullable=True)
    provider = Column(String(50), default="email")  # email, google, phone
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consumption_data = relationship("ConsumptionData", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    household_size = Column(Integer, default=4)
    state = Column(String(50), default="Gujarat")
    tariff_plan = Column(String(50), default="Residential")
    discom = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)

    user = relationship("User", back_populates="profile")
