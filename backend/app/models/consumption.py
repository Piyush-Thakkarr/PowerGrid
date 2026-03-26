from sqlalchemy import Column, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ConsumptionData(Base):
    __tablename__ = "consumption_data"

    # Composite PK required by TimescaleDB — partitioning column must be in PK
    timestamp = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    power_watts = Column(Float, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    voltage = Column(Float, nullable=True)
    current_amps = Column(Float, nullable=True)
    frequency = Column(Float, nullable=True)

    user = relationship("User", back_populates="consumption_data")

    __table_args__ = (
        Index("idx_consumption_user_time", "user_id", "timestamp"),
    )
