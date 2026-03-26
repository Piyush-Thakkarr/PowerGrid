"""Tests for seed_tariffs.py"""

import pytest
from sqlalchemy import text
from tests.conftest_seed import sync_engine, sync_session  # noqa: F401

from app.seed.seed_tariffs import seed_tariffs, DISCOM_TARIFF_DATA


class TestSeedTariffs:
    """Test DISCOM and tariff seeding logic."""

    def test_creates_all_discoms(self, sync_engine, sync_session):
        """Should create one DISCOM entry per data row."""
        d, t = seed_tariffs(sync_engine)
        assert d == len(DISCOM_TARIFF_DATA)

        count = sync_session.execute(text("SELECT COUNT(*) FROM discoms")).scalar()
        assert count == len(DISCOM_TARIFF_DATA)

    def test_creates_tariff_slabs(self, sync_engine, sync_session):
        """Should create tariff slabs for every DISCOM."""
        d, t = seed_tariffs(sync_engine)
        assert t > 0

        count = sync_session.execute(text("SELECT COUNT(*) FROM tariffs")).scalar()
        assert count == t

    def test_all_28_states_have_discoms(self, sync_engine, sync_session):
        """All 28 states should have at least one DISCOM."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(text("SELECT DISTINCT state FROM discoms")).fetchall()
        states = {row[0] for row in rows}
        assert len(states) == 28

    def test_tariff_rates_in_range(self, sync_engine, sync_session):
        """All tariff rates should be in INR 0-12 per kWh range."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(text("SELECT rate_per_unit FROM tariffs")).fetchall()
        for row in rows:
            assert 0.0 <= row[0] <= 12.0, f"Rate {row[0]} out of range"

    def test_slab_start_less_than_end(self, sync_engine, sync_session):
        """slab_start should be less than slab_end (where slab_end is not None)."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(
            text("SELECT slab_start, slab_end FROM tariffs WHERE slab_end IS NOT NULL")
        ).fetchall()
        for row in rows:
            assert row[0] < row[1], f"slab_start={row[0]} >= slab_end={row[1]}"

    def test_every_discom_has_tariffs(self, sync_engine, sync_session):
        """Every DISCOM should have at least one tariff slab."""
        seed_tariffs(sync_engine)

        discoms = sync_session.execute(text("SELECT id FROM discoms")).fetchall()
        for (discom_id,) in discoms:
            count = sync_session.execute(
                text("SELECT COUNT(*) FROM tariffs WHERE discom_id = :did"),
                {"did": discom_id},
            ).scalar()
            assert count >= 3, f"DISCOM {discom_id} has only {count} slabs"

    def test_tou_discoms_have_peak_slabs(self, sync_engine, sync_session):
        """DISCOMs with has_tou=True should have at least one ToU peak slab."""
        seed_tariffs(sync_engine)

        tou_discoms = sync_session.execute(
            text("SELECT id, name FROM discoms WHERE has_tou = 1")  # SQLite boolean
        ).fetchall()
        for discom_id, name in tou_discoms:
            peak_count = sync_session.execute(
                text("SELECT COUNT(*) FROM tariffs WHERE discom_id = :did AND is_tou_peak = 1"),
                {"did": discom_id},
            ).scalar()
            assert peak_count >= 1, f"ToU DISCOM {name} has no peak slabs"

    def test_effective_date(self, sync_engine, sync_session):
        """All tariffs should have effective_from = 2025-04-01."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(text("SELECT DISTINCT effective_from FROM tariffs")).fetchall()
        assert len(rows) == 1
        # SQLite stores dates as strings
        eff = str(rows[0][0])
        assert "2025-04-01" in eff

    def test_idempotent_reseed(self, sync_engine, sync_session):
        """Running seed_tariffs twice should not duplicate data."""
        d1, t1 = seed_tariffs(sync_engine)
        d2, t2 = seed_tariffs(sync_engine)

        count = sync_session.execute(text("SELECT COUNT(*) FROM discoms")).scalar()
        assert count == len(DISCOM_TARIFF_DATA)

    def test_delhi_has_4_discoms(self, sync_engine, sync_session):
        """Delhi should have TPDDL, BSES Rajdhani, BSES Yamuna, NDMC."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(
            text("SELECT name FROM discoms WHERE state = 'Delhi' ORDER BY name")
        ).fetchall()
        names = {row[0] for row in rows}
        assert "TPDDL" in names
        assert "BSES Rajdhani" in names
        assert "BSES Yamuna" in names
        assert "NDMC" in names
        assert len(rows) == 4

    def test_maharashtra_has_4_discoms(self, sync_engine, sync_session):
        """Maharashtra should have MSEDCL, Tata Power, Adani, BEST."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(
            text("SELECT name FROM discoms WHERE state = 'Maharashtra'")
        ).fetchall()
        names = {row[0] for row in rows}
        assert len(names) == 4
        assert "MSEDCL" in names
        assert "BEST" in names

    def test_fixed_charges_non_negative(self, sync_engine, sync_session):
        """All fixed charges should be >= 0."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(text("SELECT fixed_charge FROM tariffs")).fetchall()
        for row in rows:
            assert row[0] >= 0

    def test_regulator_codes_populated(self, sync_engine, sync_session):
        """Every DISCOM should have a non-empty regulator code."""
        seed_tariffs(sync_engine)

        rows = sync_session.execute(text("SELECT regulator FROM discoms")).fetchall()
        for row in rows:
            assert row[0] is not None
            assert len(row[0]) >= 3
