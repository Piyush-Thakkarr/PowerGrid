import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class ForecastResult(Base):
    """Cached ML prediction results per user."""
    __tablename__ = "forecast_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)       # "sarima", "prophet", "lstm"
    forecast_json = Column(JSON, nullable=False)           # predictions + confidence intervals
    metrics_json = Column(JSON, nullable=True)             # RMSE, MAE, MAPE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
