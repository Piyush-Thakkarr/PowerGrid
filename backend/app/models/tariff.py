from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Discom(Base):
    """Distribution Company — each state has one or more DISCOMs."""
    __tablename__ = "discoms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)           # e.g. "MSEDCL", "TPDDL", "BESCOM"
    full_name = Column(String(255), nullable=True)        # e.g. "Maharashtra State Electricity Distribution Co Ltd"
    state = Column(String(50), nullable=False, index=True)
    regulator = Column(String(20), nullable=False)        # e.g. "MERC", "DERC", "GERC"
    has_tou = Column(Boolean, default=False)              # supports time-of-use pricing
    electricity_duty_pct = Column(Float, default=0.0)     # state electricity duty as percentage
    fuel_surcharge_per_unit = Column(Float, default=0.0)  # fuel adjustment charge per kWh

    tariffs = relationship("Tariff", back_populates="discom_rel", cascade="all, delete-orphan")


class Tariff(Base):
    """Slab-based tariff rates per DISCOM per category."""
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    discom_id = Column(Integer, ForeignKey("discoms.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), default="Residential")  # Residential, Commercial, Industrial
    slab_start = Column(Float, nullable=False)             # kWh (inclusive)
    slab_end = Column(Float, nullable=True)                # kWh (exclusive), NULL = unlimited
    rate_per_unit = Column(Float, nullable=False)           # INR per kWh
    fixed_charge = Column(Float, default=0.0)              # INR per billing cycle for this slab
    is_tou_peak = Column(Boolean, default=False)           # if True, this rate applies during peak hours only
    tou_peak_start = Column(String(5), nullable=True)      # "18:00" — peak hour start (HH:MM)
    tou_peak_end = Column(String(5), nullable=True)        # "22:00" — peak hour end (HH:MM)
    effective_from = Column(Date, nullable=False)

    discom_rel = relationship("Discom", back_populates="tariffs")
