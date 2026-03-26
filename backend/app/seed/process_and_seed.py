"""
Data Processing & Seeding Pipeline
===================================
Reads raw smart-meter CSVs (Mathura & Bareilly, 3-min intervals),
resamples to 5-min, maps to 50 synthetic users, seeds tariffs for
all 30 Indian states, and inserts into Supabase PostgreSQL.

Usage:
    cd backend
    python -m app.seed.process_and_seed
"""

import os, uuid, hashlib, random
from datetime import datetime, date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# ── paths ──────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
RAW  = ROOT / "data" / "raw" / "kaggle_mathura_bareilly"

RAW_FILES = [
    RAW / "CEEW - Smart meter data Mathura 2019.csv",
    RAW / "CEEW - Smart meter data Mathura 2020.csv",
    RAW / "CEEW - Smart meter data Bareilly 2020.csv",
    RAW / "CEEW - Smart meter data Bareilly 2021.csv",
]

load_dotenv(ROOT / ".env")
engine = create_engine(os.getenv("DATABASE_URL_SYNC"), pool_pre_ping=True)

# ── helpers ────────────────────────────────────────────────────────
def det_uuid(seed: str) -> str:
    return str(uuid.UUID(hashlib.md5(seed.encode()).hexdigest()))

rng = random.Random(42)

# ── constants ──────────────────────────────────────────────────────
INDIAN_NAMES = [
    "Aarav Sharma","Vivaan Patel","Aditya Gupta","Ananya Reddy","Diya Singh",
    "Ishaan Mehta","Kavya Nair","Arjun Joshi","Priya Desai","Rohan Verma",
    "Neha Iyer","Siddharth Rao","Meera Kulkarni","Kabir Bhat","Tanvi Agarwal",
    "Vihaan Kumar","Riya Chopra","Arnav Tiwari","Anushka Das","Dhruv Mishra",
    "Saanvi Pillai","Reyansh Chauhan","Kiara Malhotra","Ayaan Shah","Myra Thakur",
    "Advait Sinha","Ira Pandey","Vivaan Kapoor","Anika Banerjee","Kabir Saxena",
    "Ishita Rajan","Aryan Menon","Zara Hegde","Parth Naik","Anvi Choudhury",
    "Veer Bhatt","Navya Ganesh","Rehan Srinivasan","Aditi Bose","Kian Venkat",
    "Rashi Deshpande","Rudra Karnik","Sia Gowda","Om Mukherjee","Tara Ramesh",
    "Yash Khandelwal","Pihu Jain","Anirudh Shetty","Myra Ranganathan","Dev Srivastava",
]

# ── DISCOM + tariff data ──────────────────────────────────────────
# (discom_name, full_name, state, regulator, has_tou, duty_pct, fuel_surcharge, slabs)
# slabs: [(start, end, rate, fixed_charge)]
DISCOMS_AND_TARIFFS = [
    ("UGVCL","Uttar Gujarat Vij Company","Gujarat","GERC",False,0.15,0.10,
     [(0,50,3.20,40),(50,100,3.70,40),(100,200,4.40,40),(200,300,5.10,40),(300,None,5.80,40)]),
    ("DGVCL","Dakshin Gujarat Vij Company","Gujarat","GERC",False,0.15,0.10,
     [(0,50,3.20,40),(50,100,3.70,40),(100,200,4.40,40),(200,300,5.10,40),(300,None,5.80,40)]),
    ("MSEDCL","Maharashtra State Electricity Distribution","Maharashtra","MERC",True,0.16,0.12,
     [(0,100,4.25,60),(100,300,7.50,60),(300,500,10.70,60),(500,None,12.50,60)]),
    ("BEST","BEST Undertaking","Maharashtra","MERC",True,0.16,0.12,
     [(0,100,4.25,60),(100,300,7.50,60),(300,500,10.70,60),(500,None,12.50,60)]),
    ("BSES Rajdhani","BSES Rajdhani Power","Delhi","DERC",True,0.08,0.05,
     [(0,200,0.00,25),(200,400,4.50,25),(400,800,6.50,25),(800,1200,7.00,25),(1200,None,8.00,25)]),
    ("BSES Yamuna","BSES Yamuna Power","Delhi","DERC",True,0.08,0.05,
     [(0,200,0.00,25),(200,400,4.50,25),(400,800,6.50,25),(800,1200,7.00,25),(1200,None,8.00,25)]),
    ("Tata Power DDL","Tata Power Delhi Distribution","Delhi","DERC",True,0.08,0.05,
     [(0,200,0.00,25),(200,400,4.50,25),(400,800,6.50,25),(800,None,7.00,25)]),
    ("BESCOM","Bangalore Electricity Supply","Karnataka","KERC",False,0.09,0.08,
     [(0,30,4.10,45),(30,100,5.55,45),(100,200,7.10,45),(200,None,8.15,45)]),
    ("TANGEDCO","Tamil Nadu Generation & Distribution","Tamil Nadu","TNERC",False,0.05,0.06,
     [(0,100,0.00,30),(100,200,2.50,30),(200,500,4.60,30),(500,None,6.60,30)]),
    ("UPPCL","UP Power Corporation","Uttar Pradesh","UPERC",False,0.15,0.10,
     [(0,100,3.85,55),(100,200,4.90,55),(200,300,5.55,55),(300,None,6.50,55)]),
    ("JVVNL","Jaipur Vidyut Vitran Nigam","Rajasthan","RERC",False,0.10,0.08,
     [(0,50,4.75,50),(50,150,6.50,50),(150,300,7.25,50),(300,None,7.95,50)]),
    ("WBSEDCL","WB State Electricity Distribution","West Bengal","WBERC",False,0.06,0.05,
     [(0,25,5.12,35),(25,60,5.88,35),(60,100,6.48,35),(100,300,7.28,35),(300,None,9.48,35)]),
    ("BSPHCL","Bihar State Power Holding","Bihar","BERC",False,0.08,0.04,
     [(0,50,5.50,30),(50,100,6.10,30),(100,200,6.80,30),(200,None,7.50,30)]),
    ("APSPDCL","AP Southern Power Distribution","Andhra Pradesh","APERC",False,0.06,0.05,
     [(0,30,1.90,25),(30,75,3.26,25),(75,125,4.45,25),(125,225,6.15,25),(225,400,8.75,25),(400,None,9.95,25)]),
    ("TSSPDCL","Telangana Southern Power Distribution","Telangana","TSERC",False,0.05,0.06,
     [(0,50,1.95,30),(50,100,3.55,30),(100,200,5.20,30),(200,300,7.10,30),(300,None,8.50,30)]),
    ("KSEB","Kerala State Electricity Board","Kerala","KSERC",False,0.10,0.07,
     [(0,40,3.25,40),(40,80,4.05,40),(80,120,5.10,40),(120,200,6.90,40),(200,300,7.90,40),(300,None,8.80,40)]),
    ("PSPCL","Punjab State Power Corporation","Punjab","PSERC",False,0.05,0.04,
     [(0,100,4.72,35),(100,300,6.04,35),(300,None,7.00,35)]),
    ("UHBVN","Uttar Haryana Bijli Vitran","Haryana","HERC",False,0.08,0.06,
     [(0,50,2.50,45),(50,100,5.25,45),(100,300,6.80,45),(300,None,7.10,45)]),
    ("CESU","Central Electricity Supply Utility","Odisha","OERC",False,0.06,0.04,
     [(0,50,3.50,20),(50,200,4.80,20),(200,400,5.80,20),(400,None,6.20,20)]),
    ("CSPDCL","Chhattisgarh State Power Distribution","Chhattisgarh","CSERC",False,0.10,0.05,
     [(0,100,3.30,25),(100,200,4.00,25),(200,400,5.00,25),(400,None,5.80,25)]),
    ("JBVNL","Jharkhand Bijli Vitran Nigam","Jharkhand","JSERC",False,0.05,0.04,
     [(0,100,4.25,30),(100,200,5.35,30),(200,None,5.85,30)]),
    ("APDCL","Assam Power Distribution","Assam","AERC",False,0.07,0.05,
     [(0,30,4.65,25),(30,100,5.20,25),(100,200,6.50,25),(200,None,7.50,25)]),
    ("UPCL","Uttarakhand Power Corporation","Uttarakhand","UERC",False,0.05,0.04,
     [(0,100,3.35,30),(100,200,4.20,30),(200,400,4.90,30),(400,None,5.50,30)]),
    ("HPSEB","HP State Electricity Board","Himachal Pradesh","HPERC",False,0.04,0.03,
     [(0,60,2.65,20),(60,125,3.45,20),(125,300,4.30,20),(300,None,5.00,20)]),
    ("Goa ED","Goa Electricity Department","Goa","JERC-Goa",False,0.10,0.05,
     [(0,100,2.00,25),(100,200,3.50,25),(200,400,4.50,25),(400,None,5.50,25)]),
    ("JKPDD","J&K Power Development Department","Jammu and Kashmir","JKSERC",False,0.05,0.03,
     [(0,100,1.57,15),(100,200,2.48,15),(200,None,3.52,15)]),
    ("TSECL","Tripura State Electricity Corporation","Tripura","TERC",False,0.05,0.03,
     [(0,30,4.08,20),(30,100,5.17,20),(100,200,5.73,20),(200,None,6.37,20)]),
    ("MeSEB","Meghalaya State Electricity Board","Meghalaya","MSERC",False,0.05,0.03,
     [(0,100,3.70,20),(100,200,4.60,20),(200,None,5.40,20)]),
    ("MSPCL","Manipur State Power Company","Manipur","MSERC-MN",False,0.05,0.03,
     [(0,50,4.20,20),(50,100,5.00,20),(100,200,5.90,20),(200,None,6.60,20)]),
    ("DoP Nagaland","Department of Power Nagaland","Nagaland","NSERC",False,0.05,0.03,
     [(0,60,3.60,20),(60,100,4.80,20),(100,200,5.50,20),(200,None,6.30,20)]),
    ("ZEDA","Mizoram Power & Electricity","Mizoram","JERC-MNM",False,0.05,0.03,
     [(0,50,4.40,20),(50,100,5.10,20),(100,None,5.90,20)]),
    ("DoP Arunachal","Department of Power Arunachal Pradesh","Arunachal Pradesh","APSERC",False,0.05,0.03,
     [(0,50,3.00,15),(50,100,3.50,15),(100,200,4.00,15),(200,None,4.50,15)]),
    ("Sikkim PD","Sikkim Power Department","Sikkim","SSERC",False,0.03,0.02,
     [(0,100,1.80,10),(100,200,2.90,10),(200,None,3.80,10)]),
]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1: Load & resample raw data → 5-min intervals
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def load_and_resample():
    print("  Loading raw CSVs...")
    frames = []
    for f in RAW_FILES:
        if not f.exists():
            print(f"    SKIP {f.name}")
            continue
        print(f"    {f.name}")
        df = pd.read_csv(f, parse_dates=["x_Timestamp"])
        df.rename(columns={
            "x_Timestamp": "timestamp",
            "t_kWh": "kwh",
            "z_Avg Voltage (Volt)": "voltage",
            "z_Avg Current (Amp)": "current",
            "y_Freq (Hz)": "frequency",
        }, inplace=True)
        frames.append(df)

    raw = pd.concat(frames, ignore_index=True)
    meters = sorted(raw["meter"].unique())
    print(f"    Raw rows: {len(raw):,} | Meters: {len(meters)}")

    print("  Resampling 3-min → 5-min...")
    resampled = []
    for m in meters:
        mdf = raw[raw["meter"] == m].set_index("timestamp").sort_index()
        r = mdf.resample("5min").agg({
            "kwh": "sum", "voltage": "mean", "current": "mean", "frequency": "mean",
        }).dropna()
        r["meter"] = m
        resampled.append(r.reset_index())

    result = pd.concat(resampled, ignore_index=True)
    print(f"    Resampled rows: {len(result):,}")
    return result, meters


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: Seed DISCOMs + tariffs
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def seed_discoms_and_tariffs():
    print("  Seeding DISCOMs + tariffs...")
    discom_rows = []
    tariff_rows = []

    for i, (name, full, state, reg, tou, duty, fuel, slabs) in enumerate(DISCOMS_AND_TARIFFS, 1):
        discom_rows.append({
            "id": i,
            "name": name,
            "full_name": full,
            "state": state,
            "regulator": reg,
            "has_tou": tou,
            "electricity_duty_pct": duty,
            "fuel_surcharge_per_unit": fuel,
        })

        for start, end, rate, fc in slabs:
            tariff_rows.append({
                "discom_id": i,
                "category": "Residential",
                "slab_start": start,
                "slab_end": end,
                "rate_per_unit": rate,
                "fixed_charge": fc,
                "is_tou_peak": False,
                "tou_peak_start": "18:00" if tou else None,
                "tou_peak_end": "22:00" if tou else None,
                "effective_from": date(2024, 4, 1),
            })

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM tariffs"))
        conn.execute(text("DELETE FROM discoms"))
        pd.DataFrame(discom_rows).to_sql("discoms", conn, if_exists="append", index=False)
        pd.DataFrame(tariff_rows).to_sql("tariffs", conn, if_exists="append", index=False)

    print(f"    {len(discom_rows)} DISCOMs, {len(tariff_rows)} tariff slabs")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3: Create 50 synthetic users
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def seed_users(meters):
    print("  Seeding users...")
    states = list({d[2] for d in DISCOMS_AND_TARIFFS})
    user_rows = []
    profile_rows = []

    for i, name in enumerate(INDIAN_NAMES):
        uid = det_uuid(f"user-{i}")
        state = rng.choice(states)
        user_rows.append({
            "id": uid,
            "email": name.lower().replace(" ", ".") + "@powergrid.demo",
            "name": name,
            "phone": f"+91{rng.randint(7000000000, 9999999999)}",
            "provider": "email",
            "created_at": datetime(2024, 1, 1) + timedelta(days=rng.randint(0, 30)),
        })
        profile_rows.append({
            "user_id": uid,
            "household_size": rng.randint(2, 7),
            "state": state,
            "tariff_plan": "Residential",
            "xp": rng.randint(0, 500),
            "level": rng.randint(1, 5),
        })

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM user_profiles"))
        conn.execute(text("DELETE FROM users"))
        pd.DataFrame(user_rows).to_sql("users", conn, if_exists="append", index=False)
        pd.DataFrame(profile_rows).to_sql("user_profiles", conn, if_exists="append", index=False)

    print(f"    {len(user_rows)} users + profiles")

    # return user-to-meter mapping (round-robin)
    return [(user_rows[i]["id"], meters[i % len(meters)]) for i in range(len(user_rows))]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4: Seed consumption data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def seed_consumption(data, user_meter_map):
    print("  Seeding consumption data...")

    # filter to last 6 months per meter
    filtered = []
    for m in data["meter"].unique():
        mdf = data[data["meter"] == m].copy()
        mdf.sort_values("timestamp", inplace=True)
        cutoff = mdf["timestamp"].max() - pd.Timedelta(days=180)
        filtered.append(mdf[mdf["timestamp"] >= cutoff])

    data = pd.concat(filtered, ignore_index=True)
    print(f"    6-month filtered: {len(data):,} rows")

    # map meter → user_ids
    meter_users = {}
    for uid, meter in user_meter_map:
        meter_users.setdefault(meter, []).append(uid)

    # build consumption rows
    rows = []
    for _, r in data.iterrows():
        for uid in meter_users.get(r["meter"], []):
            # power_watts = kwh * 12 * 1000 (5-min interval → hourly → watts)
            rows.append({
                "timestamp": r["timestamp"],
                "user_id": uid,
                "power_watts": round(r["kwh"] * 12 * 1000, 2),
                "energy_kwh": round(r["kwh"], 4),
                "voltage": round(r["voltage"], 2) if pd.notna(r["voltage"]) else None,
                "current_amps": round(r["current"], 3) if pd.notna(r["current"]) else None,
                "frequency": round(r["frequency"], 2) if pd.notna(r["frequency"]) else None,
            })

    print(f"    Total rows: {len(rows):,}")

    df = pd.DataFrame(rows)
    batch = 10_000
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM consumption_data"))
        for i in range(0, len(df), batch):
            df.iloc[i:i+batch].to_sql("consumption_data", conn, if_exists="append", index=False)
            print(f"      Batch {i//batch+1}/{len(df)//batch+1}")

    print(f"    Done: {len(rows):,} records")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5: Seed achievements + challenges
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def seed_gamification():
    print("  Seeding achievements + challenges...")

    achievements = [
        ("first_login", "First Login", "Log in for the first time", "🔑", {"type": "login_count", "target": 1}),
        ("week_warrior", "Week Warrior", "Log in 7 days straight", "⚡", {"type": "streak", "target": 7}),
        ("energy_saver", "Energy Saver", "Cut usage by 10% in a month", "💚", {"type": "reduction_pct", "target": 10}),
        ("peak_avoider", "Peak Avoider", "80% off-peak usage for a week", "🌙", {"type": "off_peak_pct", "target": 80}),
        ("bill_buster", "Bill Buster", "Reduce bill by 15% MoM", "💰", {"type": "bill_reduction_pct", "target": 15}),
        ("green_champ", "Green Champion", "Below state avg for 3 months", "🏆", {"type": "below_avg_months", "target": 3}),
        ("data_nerd", "Data Nerd", "Check analytics 50 times", "📊", {"type": "analytics_views", "target": 50}),
        ("social_fly", "Social Butterfly", "Compare with 10 households", "🦋", {"type": "comparisons", "target": 10}),
        ("night_saver", "Night Owl Saver", "Night usage <1kWh for a week", "🦉", {"type": "night_kwh_max", "target": 1}),
        ("heat_hero", "Heat Wave Hero", "Cut AC during peak summer", "🌡️", {"type": "summer_reduction", "target": 15}),
        ("festival_saver", "Festival Saver", "Stable usage during Diwali", "🪔", {"type": "festival_stable", "target": 5}),
        ("marathon", "30-Day Marathon", "Log in 30 days straight", "🏅", {"type": "streak", "target": 30}),
    ]

    challenges = [
        ("5% Weekly Cut", "Reduce usage by 5% this week", 5.0, "%", 7),
        ("Off-Peak Power", "70% off-peak for 3 days", 70.0, "%", 3),
        ("Unplug Weekend", "Weekend below weekday avg", 0.0, "kWh", 2),
        ("AC Optimizer", "AC under 4hrs/day for a week", 4.0, "hours", 7),
        ("Monthly Saver", "Cut bill by 10% this month", 10.0, "%", 30),
        ("Green Streak", "Below state avg for 2 weeks", 0.0, "%", 14),
    ]

    import json

    ach_rows = [{"id": a[0], "name": a[1], "description": a[2], "icon": a[3],
                 "criteria_json": json.dumps(a[4])} for a in achievements]

    today = date.today()
    ch_rows = [{"name": c[0], "description": c[1], "target": c[2], "unit": c[3],
                "start_date": today, "end_date": today + timedelta(days=c[4]),
                "is_active": True} for c in challenges]

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM user_achievements"))
        conn.execute(text("DELETE FROM achievements"))
        conn.execute(text("DELETE FROM user_challenges"))
        conn.execute(text("DELETE FROM challenges"))
        pd.DataFrame(ach_rows).to_sql("achievements", conn, if_exists="append", index=False)
        pd.DataFrame(ch_rows).to_sql("challenges", conn, if_exists="append", index=False)

    print(f"    {len(achievements)} achievements, {len(challenges)} challenges")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    print("=" * 50)
    print("PowerGrid Seeding Pipeline")
    print("=" * 50)

    data, meters = load_and_resample()
    seed_discoms_and_tariffs()
    user_meter_map = seed_users(meters)
    seed_gamification()
    seed_consumption(data, user_meter_map)

    print("\n  Verifying...")
    with engine.connect() as conn:
        for t in ["discoms","tariffs","users","user_profiles",
                   "achievements","challenges","consumption_data"]:
            n = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"    {t}: {n:,}")

    print("\nDone!")

if __name__ == "__main__":
    main()
