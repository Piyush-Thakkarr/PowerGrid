"""
Seed script: Process Mathura/Bareilly smart meter CSVs and insert into consumption_data.

Pipeline:
  1. Read raw CEEW CSV files (3-min intervals, ~18M rows across 4 files)
  2. Resample to 5-min intervals using pandas
  3. Compute power_watts from energy_kwh
  4. Map each meter to a seeded user_id
  5. Insert in batches of 5000 rows via raw SQL COPY-style inserts
"""

import os
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import get_settings

# Columns in the raw CSV files
COL_TIMESTAMP = "x_Timestamp"
COL_KWH = "t_kWh"
COL_VOLTAGE = "z_Avg Voltage (Volt)"
COL_CURRENT = "z_Avg Current (Amp)"
COL_FREQ = "y_Freq (Hz)"
COL_METER = "meter"

RAW_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "kaggle_mathura_bareilly"

CSV_FILES = [
    "CEEW - Smart meter data Mathura 2019.csv",
    "CEEW - Smart meter data Mathura 2020.csv",
    "CEEW - Smart meter data Bareilly 2020.csv",
    "CEEW - Smart meter data Bareilly 2021.csv",
]

# Batch size for DB inserts
BATCH_SIZE = 5000


def get_sync_engine():
    settings = get_settings()
    return create_engine(settings.database_url_sync, echo=False)


def _get_user_ids(engine):
    """Fetch all seeded user IDs in order."""
    with Session(engine) as session:
        rows = session.execute(
            text("SELECT id FROM users ORDER BY created_at")
        ).fetchall()
        return [row[0] for row in rows]


def _build_meter_user_map(engine):
    """Discover unique meters across all CSV files and map each to a user_id."""
    all_meters = set()
    for csv_name in CSV_FILES:
        fpath = RAW_DATA_DIR / csv_name
        if not fpath.exists():
            continue
        df = pd.read_csv(fpath, usecols=[COL_METER])
        all_meters.update(df[COL_METER].unique())

    meters_sorted = sorted(all_meters)
    user_ids = _get_user_ids(engine)

    if not user_ids:
        raise RuntimeError("No users found. Run seed_users first.")

    # Round-robin assignment: meter -> user
    meter_to_user = {}
    for i, meter in enumerate(meters_sorted):
        meter_to_user[meter] = user_ids[i % len(user_ids)]

    print(f"  Mapped {len(meters_sorted)} meters to {len(user_ids)} users.")
    return meter_to_user


def _process_file(fpath: Path, meter_to_user: dict):
    """
    Read a raw CSV, resample 3-min -> 5-min, compute power_watts.
    Yields DataFrames in chunks suitable for batch insert.
    """
    print(f"  Reading {fpath.name}...")
    t0 = time.time()

    # Read in chunks to limit memory
    chunks = pd.read_csv(
        fpath,
        parse_dates=[COL_TIMESTAMP],
        dtype={COL_KWH: np.float32, COL_VOLTAGE: np.float32,
               COL_CURRENT: np.float32, COL_FREQ: np.float32},
        chunksize=500_000,
    )

    total_rows = 0
    for chunk_idx, chunk in enumerate(chunks):
        # Drop rows with missing timestamp or kWh
        chunk = chunk.dropna(subset=[COL_TIMESTAMP, COL_KWH])

        # Process per meter
        meters_in_chunk = chunk[COL_METER].unique()
        resampled_parts = []

        for meter in meters_in_chunk:
            if meter not in meter_to_user:
                continue
            mdf = chunk[chunk[COL_METER] == meter].copy()
            mdf = mdf.set_index(COL_TIMESTAMP).sort_index()

            # Resample from 3-min to 5-min: sum energy, mean for voltage/current/freq
            resampled = mdf.resample("5min").agg({
                COL_KWH: "sum",
                COL_VOLTAGE: "mean",
                COL_CURRENT: "mean",
                COL_FREQ: "mean",
            }).dropna(subset=[COL_KWH])

            # Skip zero-energy rows
            resampled = resampled[resampled[COL_KWH] > 0]

            if resampled.empty:
                continue

            # Compute power: energy_kwh * 12000 = watts (for 5-min interval)
            resampled["power_watts"] = resampled[COL_KWH] * 12000.0
            resampled["user_id"] = str(meter_to_user[meter])
            resampled = resampled.reset_index()
            resampled = resampled.rename(columns={
                COL_TIMESTAMP: "timestamp",
                COL_KWH: "energy_kwh",
                COL_VOLTAGE: "voltage",
                COL_CURRENT: "current_amps",
                COL_FREQ: "frequency",
            })

            resampled_parts.append(resampled[[
                "timestamp", "user_id", "power_watts", "energy_kwh",
                "voltage", "current_amps", "frequency"
            ]])

        if resampled_parts:
            combined = pd.concat(resampled_parts, ignore_index=True)
            total_rows += len(combined)
            yield combined

    elapsed = time.time() - t0
    print(f"    Processed {fpath.name}: {total_rows:,} resampled rows in {elapsed:.1f}s")


def _insert_batch(engine, rows: list[dict]):
    """Insert a batch of rows using executemany for speed."""
    if not rows:
        return
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO consumption_data
                    (timestamp, user_id, power_watts, energy_kwh, voltage, current_amps, frequency)
                VALUES
                    (:timestamp, :user_id, :power_watts, :energy_kwh, :voltage, :current_amps, :frequency)
                ON CONFLICT (timestamp, user_id) DO NOTHING
            """),
            rows,
        )


def seed_consumption(engine=None):
    """Process CSVs and seed consumption_data. Returns total rows inserted."""
    if engine is None:
        engine = get_sync_engine()

    # Check if already seeded (at least 100K rows is a good sign)
    with Session(engine) as session:
        existing = session.execute(text("SELECT COUNT(*) FROM consumption_data")).scalar()
        if existing and existing > 100_000:
            print(f"  Consumption data already seeded ({existing:,} rows). Skipping.")
            return existing

        # Clear for reseed if partial data exists
        if existing and existing > 0:
            print(f"  Clearing {existing:,} existing rows for reseed...")
            session.execute(text("DELETE FROM consumption_data"))
            session.commit()

    meter_to_user = _build_meter_user_map(engine)

    total_inserted = 0
    batch_buffer = []

    for csv_name in CSV_FILES:
        fpath = RAW_DATA_DIR / csv_name
        if not fpath.exists():
            print(f"  WARNING: {csv_name} not found, skipping.")
            continue

        for df_chunk in _process_file(fpath, meter_to_user):
            records = df_chunk.to_dict("records")

            # Clean up NaN values for nullable columns
            for rec in records:
                for col in ("voltage", "current_amps", "frequency"):
                    if pd.isna(rec.get(col)):
                        rec[col] = None

            batch_buffer.extend(records)

            # Flush in BATCH_SIZE increments
            while len(batch_buffer) >= BATCH_SIZE:
                batch = batch_buffer[:BATCH_SIZE]
                batch_buffer = batch_buffer[BATCH_SIZE:]
                _insert_batch(engine, batch)
                total_inserted += len(batch)

                if total_inserted % 50_000 == 0:
                    print(f"    Inserted {total_inserted:,} rows...")

    # Flush remaining
    if batch_buffer:
        _insert_batch(engine, batch_buffer)
        total_inserted += len(batch_buffer)

    print(f"  Done: {total_inserted:,} consumption rows inserted.")
    return total_inserted


if __name__ == "__main__":
    print("=== Seeding Consumption Data ===")
    n = seed_consumption()
    print(f"Total: {n:,} rows.")
