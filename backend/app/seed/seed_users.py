"""
Seed script: Create 50 users with profiles.
  - 2 demo users (demo@powergrid.in, demo2@powergrid.in)
  - 48 random users distributed across 28 Indian states
"""

import uuid
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base
from app.models.user import User, UserProfile

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Delhi", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

# Discom names per state (first listed discom is default for random users)
STATE_DISCOMS = {
    "Andhra Pradesh": ["APSPDCL", "APEPDCL"],
    "Arunachal Pradesh": ["Arunachal DoP"],
    "Assam": ["APDCL"],
    "Bihar": ["SBPDCL", "NBPDCL"],
    "Chhattisgarh": ["CSPDCL"],
    "Delhi": ["TPDDL", "BSES Rajdhani", "BSES Yamuna", "NDMC"],
    "Goa": ["Goa Electricity Dept"],
    "Gujarat": ["UGVCL", "PGVCL", "MGVCL", "DGVCL"],
    "Haryana": ["UHBVNL", "DHBVNL"],
    "Himachal Pradesh": ["HPSEB"],
    "Jharkhand": ["JBVNL"],
    "Karnataka": ["BESCOM", "MESCOM", "HESCOM", "GESCOM", "CESC Mysore"],
    "Kerala": ["KSEB"],
    "Madhya Pradesh": ["MP West", "MP Central", "MP East"],
    "Maharashtra": ["MSEDCL", "Tata Power Mumbai", "Adani Electricity", "BEST"],
    "Manipur": ["MSPCL"],
    "Meghalaya": ["MeECL"],
    "Mizoram": ["Mizoram P&E Dept"],
    "Nagaland": ["Nagaland DoP"],
    "Odisha": ["TPCODL", "TPNODL", "TPWODL", "TPSODL"],
    "Punjab": ["PSPCL"],
    "Rajasthan": ["JVVNL", "AVVNL", "JdVVNL"],
    "Tamil Nadu": ["TANGEDCO"],
    "Telangana": ["TSSPDCL", "TSNPDCL"],
    "Tripura": ["TSECL"],
    "Uttar Pradesh": ["DVVNL", "MVVNL", "PuVVNL", "KESCO", "PVVNL"],
    "Uttarakhand": ["UPCL"],
    "West Bengal": ["WBSEDCL", "CESC Kolkata"],
}

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun",
    "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Ananya", "Diya", "Saanvi", "Aanya", "Aadhya",
    "Myra", "Sara", "Ira", "Ahana", "Kiara",
    "Rohan", "Kabir", "Advait", "Dhruv", "Yash",
    "Priya", "Neha", "Riya", "Meera", "Shreya",
    "Raj", "Amit", "Vikram", "Suresh", "Rahul",
    "Pooja", "Kavita", "Sunita", "Rekha", "Deepa",
    "Karan", "Nikhil", "Manish", "Varun", "Gaurav",
    "Nisha", "Swati", "Anjali", "Preeti", "Komal",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Kumar", "Singh",
    "Reddy", "Nair", "Iyer", "Gupta", "Jain",
    "Mishra", "Das", "Rao", "Pillai", "Menon",
    "Chauhan", "Desai", "Bose", "Sen", "Bhatt",
    "Agarwal", "Saxena", "Tiwari", "Pandey", "Yadav",
    "Banerjee", "Mukherjee", "Srivastava", "Patil", "Kulkarni",
]


def get_sync_engine():
    settings = get_settings()
    return create_engine(settings.database_url_sync, echo=False)


def seed_users(engine=None):
    """Create 50 users with profiles. Returns list of created user IDs."""
    if engine is None:
        engine = get_sync_engine()

    created_ids = []

    with Session(engine) as session:
        # Check if users already exist
        existing = session.execute(text("SELECT COUNT(*) FROM users")).scalar()
        if existing and existing >= 50:
            print(f"  Users already seeded ({existing} found). Skipping.")
            # Return existing user IDs
            rows = session.execute(text("SELECT id FROM users ORDER BY created_at")).fetchall()
            return [row[0] for row in rows]

        # Clear existing seed data for a clean reseed
        if existing and existing > 0:
            print(f"  Clearing {existing} existing users for reseed...")
            session.execute(text("DELETE FROM user_profiles"))
            session.execute(text("DELETE FROM users"))
            session.commit()

        # -- Demo users --
        demo_users = [
            {
                "email": "demo@powergrid.in",
                "name": "Demo User",
                "state": "Gujarat",
                "discom": "UGVCL",
                "household_size": 4,
            },
            {
                "email": "demo2@powergrid.in",
                "name": "Demo User 2",
                "state": "Maharashtra",
                "discom": "MSEDCL",
                "household_size": 3,
            },
        ]

        for i, du in enumerate(demo_users):
            uid = uuid.uuid4()
            user = User(id=uid, email=du["email"], name=du["name"], provider="email")
            session.add(user)
            session.flush()

            profile = UserProfile(
                user_id=uid,
                household_size=du["household_size"],
                state=du["state"],
                tariff_plan="Residential",
                discom=du["discom"],
                xp=0,
                level=1,
            )
            session.add(profile)
            created_ids.append(uid)
            print(f"  [{i+1}/50] Created demo user: {du['email']}")

        # -- Random users --
        random.seed(42)  # reproducible
        used_names = set()

        for i in range(48):
            # Distribute across states (cycle through them, then random)
            state = INDIAN_STATES[i % len(INDIAN_STATES)] if i < 28 else random.choice(INDIAN_STATES)
            discoms = STATE_DISCOMS[state]
            discom = random.choice(discoms)
            household_size = random.randint(1, 8)

            # Generate unique name
            while True:
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                full_name = f"{first} {last}"
                if full_name not in used_names:
                    used_names.add(full_name)
                    break

            email = f"{first.lower()}.{last.lower()}{random.randint(1, 99)}@powergrid.in"

            uid = uuid.uuid4()
            user = User(id=uid, email=email, name=full_name, provider="email")
            session.add(user)
            session.flush()

            profile = UserProfile(
                user_id=uid,
                household_size=household_size,
                state=state,
                tariff_plan="Residential",
                discom=discom,
                xp=0,
                level=1,
            )
            session.add(profile)
            created_ids.append(uid)

            if (i + 3) % 10 == 0 or i == 47:
                print(f"  [{i+3}/50] {full_name} ({state}, {discom})")

        session.commit()
        print(f"  Done: {len(created_ids)} users created.")

    return created_ids


if __name__ == "__main__":
    print("=== Seeding Users ===")
    ids = seed_users()
    print(f"Created {len(ids)} users.")
