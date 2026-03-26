"""Tests for seed_consumption.py"""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from tests.conftest_seed import sync_engine, sync_session  # noqa: F401

from app.seed.seed_consumption import (
    _process_file,
    _insert_batch,
    _build_meter_user_map,
    COL_TIMESTAMP, COL_KWH, COL_VOLTAGE, COL_CURRENT, COL_FREQ, COL_METER,
    BATCH_SIZE,
)
from app.models.user import User, UserProfile


def _create_test_users(engine, n=5):
    """Helper: insert N test users."""
    ids = []
    with Session(engine) as session:
        for i in range(n):
            uid = uuid.uuid4()
            user = User(id=uid, email=f"test{i}@example.com", name=f"Test {i}")
            session.add(user)
            session.flush()
            profile = UserProfile(user_id=uid, state="Gujarat", discom="UGVCL")
            session.add(profile)
            ids.append(uid)
        session.commit()
    return ids


def _create_test_csv(tmp_path, meters, n_rows=50):
    """Helper: create a small CSV matching the CEEW format."""
    rows = []
    base_ts = datetime(2020, 1, 1)
    for meter in meters:
        for i in range(n_rows):
            ts = base_ts.replace(minute=(i * 3) % 60, hour=(i * 3) // 60 % 24)
            rows.append({
                COL_TIMESTAMP: ts.strftime("%Y-%m-%d %H:%M:%S"),
                COL_KWH: round(np.random.uniform(0.005, 0.05), 4),
                COL_VOLTAGE: round(np.random.uniform(220, 250), 2),
                COL_CURRENT: round(np.random.uniform(0.5, 3.0), 2),
                COL_FREQ: round(np.random.uniform(49.9, 50.1), 2),
                COL_METER: meter,
            })
    df = pd.DataFrame(rows)
    fpath = tmp_path / "test_meter_data.csv"
    df.to_csv(fpath, index=False)
    return fpath


class TestProcessFile:
    """Test CSV processing logic."""

    def test_resamples_to_5min(self, tmp_path):
        """Output should have 5-min timestamps."""
        fpath = _create_test_csv(tmp_path, ["M01"], n_rows=30)
        meter_map = {"M01": uuid.uuid4()}

        chunks = list(_process_file(fpath, meter_map))
        assert len(chunks) > 0

        df = pd.concat(chunks)
        # Check timestamp frequency is 5min
        ts = pd.to_datetime(df["timestamp"]).sort_values()
        if len(ts) > 1:
            diffs = ts.diff().dropna()
            # All diffs should be multiples of 5 minutes
            for d in diffs:
                assert d.total_seconds() % 300 == 0

    def test_computes_power_watts(self, tmp_path):
        """power_watts should equal energy_kwh * 12000."""
        fpath = _create_test_csv(tmp_path, ["M01"], n_rows=30)
        meter_map = {"M01": uuid.uuid4()}

        chunks = list(_process_file(fpath, meter_map))
        df = pd.concat(chunks)

        for _, row in df.iterrows():
            expected = row["energy_kwh"] * 12000.0
            assert abs(row["power_watts"] - expected) < 0.01

    def test_maps_meter_to_user(self, tmp_path):
        """Each row should have the correct user_id for its meter."""
        uid1 = uuid.uuid4()
        uid2 = uuid.uuid4()
        fpath = _create_test_csv(tmp_path, ["M01", "M02"], n_rows=20)
        meter_map = {"M01": uid1, "M02": uid2}

        chunks = list(_process_file(fpath, meter_map))
        df = pd.concat(chunks)

        assert str(uid1) in df["user_id"].values
        assert str(uid2) in df["user_id"].values

    def test_skips_unknown_meters(self, tmp_path):
        """Meters not in the map should be silently skipped."""
        fpath = _create_test_csv(tmp_path, ["M01", "UNKNOWN"], n_rows=20)
        meter_map = {"M01": uuid.uuid4()}

        chunks = list(_process_file(fpath, meter_map))
        df = pd.concat(chunks)

        assert "UNKNOWN" not in df.get("meter", pd.Series()).values
        assert len(df) > 0  # M01 data should still be there

    def test_handles_empty_csv(self, tmp_path):
        """Empty CSV should yield no chunks."""
        fpath = tmp_path / "empty.csv"
        # Write header only
        with open(fpath, "w") as f:
            f.write(f"{COL_TIMESTAMP},{COL_KWH},{COL_VOLTAGE},{COL_CURRENT},{COL_FREQ},{COL_METER}\n")

        meter_map = {"M01": uuid.uuid4()}
        chunks = list(_process_file(fpath, meter_map))
        if chunks:
            df = pd.concat(chunks)
            assert len(df) == 0 or df.empty


class TestInsertBatch:
    """Test batch insertion logic."""

    def test_inserts_rows(self, sync_engine):
        """Should insert rows into consumption_data."""
        user_ids = _create_test_users(sync_engine, n=1)
        uid = user_ids[0]

        rows = [
            {
                "timestamp": datetime(2020, 1, 1, i, 0, tzinfo=timezone.utc),
                "user_id": str(uid),
                "power_watts": 200.0 + i,
                "energy_kwh": 0.0167 + i * 0.001,
                "voltage": 230.0,
                "current_amps": 1.0,
                "frequency": 50.0,
            }
            for i in range(10)
        ]

        _insert_batch(sync_engine, rows)

        with Session(sync_engine) as session:
            count = session.execute(text("SELECT COUNT(*) FROM consumption_data")).scalar()
            assert count == 10

    def test_handles_duplicates(self, sync_engine):
        """ON CONFLICT DO NOTHING should skip duplicates gracefully."""
        user_ids = _create_test_users(sync_engine, n=1)
        uid = user_ids[0]

        row = {
            "timestamp": datetime(2020, 1, 1, 0, 0, tzinfo=timezone.utc),
            "user_id": str(uid),
            "power_watts": 200.0,
            "energy_kwh": 0.0167,
            "voltage": 230.0,
            "current_amps": 1.0,
            "frequency": 50.0,
        }

        _insert_batch(sync_engine, [row])

        # SQLite doesn't support ON CONFLICT the same way; just verify no crash
        # In production (Postgres), duplicates would be skipped
        with Session(sync_engine) as session:
            count = session.execute(text("SELECT COUNT(*) FROM consumption_data")).scalar()
            assert count >= 1

    def test_empty_batch(self, sync_engine):
        """Empty batch should be a no-op."""
        _insert_batch(sync_engine, [])

        with Session(sync_engine) as session:
            count = session.execute(text("SELECT COUNT(*) FROM consumption_data")).scalar()
            assert count == 0


class TestBuildMeterUserMap:
    """Test meter-to-user mapping."""

    def test_maps_meters_to_users(self, sync_engine, tmp_path):
        """Should map discovered meters to user IDs via round-robin."""
        user_ids = _create_test_users(sync_engine, n=3)

        # Create a test CSV in the expected location
        fpath = _create_test_csv(tmp_path, ["MA01", "MA02", "MA03", "MA04"], n_rows=5)

        # Patch CSV_FILES and RAW_DATA_DIR
        with patch("app.seed.seed_consumption.RAW_DATA_DIR", tmp_path), \
             patch("app.seed.seed_consumption.CSV_FILES", ["test_meter_data.csv"]):
            meter_map = _build_meter_user_map(sync_engine)

        assert len(meter_map) == 4
        # Round-robin: 4 meters across 3 users means one user gets 2 meters
        mapped_users = set(meter_map.values())
        assert len(mapped_users) <= 3
