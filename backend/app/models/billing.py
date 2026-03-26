import uuid
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_units = Column(Float, nullable=False)
    energy_charge = Column(Float, nullable=False)       # sum of slab-wise energy costs
    fixed_charge = Column(Float, nullable=False)         # fixed charge from tariff
    electricity_duty = Column(Float, nullable=False)     # duty amount
    fuel_surcharge = Column(Float, nullable=False)       # fuel adjustment
    total_cost = Column(Float, nullable=False)           # grand total
    breakdown_json = Column(JSON, nullable=False)        # detailed slab breakdown
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bills")
