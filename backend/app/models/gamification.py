from sqlalchemy import Column, Integer, Float, String, Boolean, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(50), primary_key=True)             # e.g. "first_week", "green_warrior"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(10), nullable=False)              # emoji
    criteria_json = Column(JSON, nullable=True)            # conditions to unlock


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    achievement_id = Column(String(50), ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    target = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)              # "%", "kWh"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), primary_key=True)
    progress = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    period = Column(String(20), nullable=False)            # "2026-03" (year-month)
    rank = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    savings_percent = Column(Float, nullable=False)
