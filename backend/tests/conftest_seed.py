"""
Shared fixtures for seed script tests.
Uses a sync SQLite engine (no Postgres/Supabase dependency).
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import *  # noqa: F401,F403 — register all models


TEST_SYNC_DB_URL = "sqlite:///./test_seed.db"


@pytest.fixture
def sync_engine():
    """Create a fresh SQLite engine with all tables for each test."""
    engine = create_engine(TEST_SYNC_DB_URL, echo=False)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def sync_session(sync_engine):
    """Provide a sync session for assertions."""
    with Session(sync_engine) as session:
        yield session
