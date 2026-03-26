import pytest
from sqlalchemy import inspect

from app.database import Base


EXPECTED_TABLES = [
    "users",
    "user_profiles",
    "consumption_data",
    "discoms",
    "tariffs",
    "bills",
    "achievements",
    "user_achievements",
    "challenges",
    "user_challenges",
    "leaderboard",
    "forecast_results",
    "detected_anomalies",
]


@pytest.mark.asyncio
async def test_all_tables_exist(db_session):
    """All expected tables should be created by the test fixture."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        table_names = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )

    for table in EXPECTED_TABLES:
        assert table in table_names, f"Table '{table}' not found. Got: {table_names}"


@pytest.mark.asyncio
async def test_table_count_matches():
    """We expect exactly 13 tables."""
    table_names = Base.metadata.tables.keys()
    assert len(table_names) == len(EXPECTED_TABLES), (
        f"Expected {len(EXPECTED_TABLES)} tables, got {len(table_names)}: {list(table_names)}"
    )


@pytest.mark.asyncio
async def test_user_table_has_correct_columns(db_session):
    """User table should have the expected columns."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("users")]
        )

    expected = ["id", "email", "name", "phone", "provider", "created_at", "updated_at"]
    for col in expected:
        assert col in columns, f"Column '{col}' missing from users table. Got: {columns}"


@pytest.mark.asyncio
async def test_consumption_table_has_correct_columns(db_session):
    """ConsumptionData table should have time-series columns."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("consumption_data")]
        )

    expected = ["user_id", "timestamp", "power_watts", "energy_kwh", "voltage", "current_amps", "frequency"]
    for col in expected:
        assert col in columns, f"Column '{col}' missing from consumption_data. Got: {columns}"


@pytest.mark.asyncio
async def test_tariff_table_has_tou_columns(db_session):
    """Tariff table should support time-of-use pricing."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("tariffs")]
        )

    tou_columns = ["is_tou_peak", "tou_peak_start", "tou_peak_end"]
    for col in tou_columns:
        assert col in columns, f"ToU column '{col}' missing from tariffs. Got: {columns}"


@pytest.mark.asyncio
async def test_discom_table_has_duty_and_surcharge(db_session):
    """Discom table should have electricity duty and fuel surcharge fields."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("discoms")]
        )

    expected = ["electricity_duty_pct", "fuel_surcharge_per_unit", "has_tou"]
    for col in expected:
        assert col in columns, f"Column '{col}' missing from discoms. Got: {columns}"


@pytest.mark.asyncio
async def test_bill_table_has_component_columns(db_session):
    """Bill table should break down costs into components."""
    from tests.conftest import test_engine

    async with test_engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("bills")]
        )

    expected = ["energy_charge", "fixed_charge", "electricity_duty", "fuel_surcharge", "total_cost"]
    for col in expected:
        assert col in columns, f"Column '{col}' missing from bills. Got: {columns}"
