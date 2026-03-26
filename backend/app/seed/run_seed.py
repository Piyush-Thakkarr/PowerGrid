"""
Orchestrator: Run all seed scripts in the correct order.

Usage:
    cd backend/
    python -m app.seed.run_seed
"""

import sys
import time

from sqlalchemy import create_engine

from app.config import get_settings
from app.database import Base
from app.models import *  # noqa: F401,F403 — register all models with metadata


def main():
    print("=" * 60)
    print("  PowerGrid Database Seeder")
    print("=" * 60)

    settings = get_settings()
    engine = create_engine(settings.database_url_sync, echo=False)

    # Ensure tables exist
    print("\n[0/4] Ensuring tables exist...")
    Base.metadata.create_all(bind=engine)
    print("  Tables ready.\n")

    total_start = time.time()

    # Step 1: Users
    print("[1/4] Seeding Users...")
    t0 = time.time()
    from app.seed.seed_users import seed_users
    user_ids = seed_users(engine)
    print(f"  Elapsed: {time.time() - t0:.1f}s\n")

    # Step 2: Tariffs & DISCOMs
    print("[2/4] Seeding DISCOMs & Tariffs...")
    t0 = time.time()
    from app.seed.seed_tariffs import seed_tariffs
    discom_count, tariff_count = seed_tariffs(engine)
    print(f"  Elapsed: {time.time() - t0:.1f}s\n")

    # Step 3: Consumption data
    print("[3/4] Seeding Consumption Data (this may take several minutes)...")
    t0 = time.time()
    from app.seed.seed_consumption import seed_consumption
    row_count = seed_consumption(engine)
    print(f"  Elapsed: {time.time() - t0:.1f}s\n")

    # Step 4: Gamification
    print("[4/4] Seeding Gamification...")
    t0 = time.time()
    from app.seed.seed_gamification import seed_gamification
    seed_gamification(engine)
    print(f"  Elapsed: {time.time() - t0:.1f}s\n")

    total_elapsed = time.time() - total_start
    print("=" * 60)
    print(f"  All seeds complete in {total_elapsed:.1f}s")
    print(f"  Users:        {len(user_ids)}")
    print(f"  DISCOMs:      {discom_count}")
    print(f"  Tariff slabs: {tariff_count}")
    print(f"  Consumption:  {row_count:,} rows")
    print("=" * 60)


if __name__ == "__main__":
    main()
