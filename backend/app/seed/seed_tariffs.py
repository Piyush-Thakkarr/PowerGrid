"""
Seed script: Insert DISCOMs and residential tariff slabs for all 28 Indian states.

Rates are based on publicly available SERC tariff orders for FY 2025-26.
Each DISCOM gets 4-6 residential slabs with progressive rates.
Delhi DISCOMs include ToU peak rates.
"""

from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.tariff import Discom, Tariff

EFFECTIVE_DATE = date(2025, 4, 1)  # FY 2025-26


def _discom(name, full_name, state, regulator, has_tou=False,
            electricity_duty_pct=0.0, fuel_surcharge=0.0):
    return {
        "name": name,
        "full_name": full_name,
        "state": state,
        "regulator": regulator,
        "has_tou": has_tou,
        "electricity_duty_pct": electricity_duty_pct,
        "fuel_surcharge_per_unit": fuel_surcharge,
    }


def _slab(slab_start, slab_end, rate, fixed=0.0,
          is_tou_peak=False, peak_start=None, peak_end=None):
    return {
        "slab_start": slab_start,
        "slab_end": slab_end,
        "rate_per_unit": rate,
        "fixed_charge": fixed,
        "is_tou_peak": is_tou_peak,
        "tou_peak_start": peak_start,
        "tou_peak_end": peak_end,
    }


# ============================================================
#  DISCOM + TARIFF DATA FOR ALL 28 STATES
# ============================================================

DISCOM_TARIFF_DATA = [
    # ---- Andhra Pradesh (APERC) ----
    (_discom("APSPDCL", "AP Southern Power Distribution Co Ltd", "Andhra Pradesh", "APERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 1.90, 25), _slab(50, 100, 3.02, 25), _slab(100, 200, 4.50, 50),
      _slab(200, 300, 6.00, 50), _slab(300, None, 7.50, 75)]),

    (_discom("APEPDCL", "AP Eastern Power Distribution Co Ltd", "Andhra Pradesh", "APERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 1.90, 25), _slab(50, 100, 3.02, 25), _slab(100, 200, 4.50, 50),
      _slab(200, 300, 6.00, 50), _slab(300, None, 7.50, 75)]),

    # ---- Arunachal Pradesh (APSERC) ----
    (_discom("Arunachal DoP", "Arunachal Pradesh Dept of Power", "Arunachal Pradesh", "APSERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 50, 2.00, 20), _slab(50, 100, 2.80, 20), _slab(100, 200, 3.80, 40),
      _slab(200, None, 5.00, 50)]),

    # ---- Assam (AERC) ----
    (_discom("APDCL", "Assam Power Distribution Co Ltd", "Assam", "AERC",
             electricity_duty_pct=3.0, fuel_surcharge=0.15),
     [_slab(0, 50, 2.50, 20), _slab(50, 120, 4.30, 30), _slab(120, 240, 5.50, 45),
      _slab(240, 400, 6.40, 60), _slab(400, None, 7.25, 75)]),

    # ---- Bihar (BERC) ----
    (_discom("SBPDCL", "South Bihar Power Distribution Co Ltd", "Bihar", "BERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.08),
     [_slab(0, 50, 2.80, 30), _slab(50, 100, 3.85, 30), _slab(100, 200, 5.20, 45),
      _slab(200, 300, 6.35, 60), _slab(300, None, 7.00, 80)]),

    (_discom("NBPDCL", "North Bihar Power Distribution Co Ltd", "Bihar", "BERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.08),
     [_slab(0, 50, 2.80, 30), _slab(50, 100, 3.85, 30), _slab(100, 200, 5.20, 45),
      _slab(200, 300, 6.35, 60), _slab(300, None, 7.00, 80)]),

    # ---- Chhattisgarh (CSERC) ----
    (_discom("CSPDCL", "Chhattisgarh State Power Distribution Co Ltd", "Chhattisgarh", "CSERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.12),
     [_slab(0, 50, 2.20, 15), _slab(50, 100, 3.00, 20), _slab(100, 200, 4.00, 35),
      _slab(200, 400, 5.20, 50), _slab(400, None, 6.50, 70)]),

    # ---- Delhi (DERC) — with ToU ----
    (_discom("TPDDL", "Tata Power Delhi Distribution Ltd", "Delhi", "DERC",
             has_tou=True, electricity_duty_pct=5.0, fuel_surcharge=0.08),
     [_slab(0, 200, 3.00, 20), _slab(200, 400, 4.50, 40), _slab(400, 800, 6.50, 80),
      _slab(800, 1200, 7.00, 100), _slab(1200, None, 7.75, 125),
      # ToU peak slab
      _slab(0, None, 8.50, 0, True, "14:00", "17:00")]),

    (_discom("BSES Rajdhani", "BSES Rajdhani Power Ltd", "Delhi", "DERC",
             has_tou=True, electricity_duty_pct=5.0, fuel_surcharge=0.08),
     [_slab(0, 200, 3.00, 20), _slab(200, 400, 4.50, 40), _slab(400, 800, 6.50, 80),
      _slab(800, 1200, 7.00, 100), _slab(1200, None, 7.75, 125),
      _slab(0, None, 8.50, 0, True, "14:00", "17:00")]),

    (_discom("BSES Yamuna", "BSES Yamuna Power Ltd", "Delhi", "DERC",
             has_tou=True, electricity_duty_pct=5.0, fuel_surcharge=0.08),
     [_slab(0, 200, 3.00, 20), _slab(200, 400, 4.50, 40), _slab(400, 800, 6.50, 80),
      _slab(800, 1200, 7.00, 100), _slab(1200, None, 7.75, 125),
      _slab(0, None, 8.50, 0, True, "14:00", "17:00")]),

    (_discom("NDMC", "New Delhi Municipal Council", "Delhi", "DERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.05),
     [_slab(0, 200, 3.15, 25), _slab(200, 400, 4.65, 50), _slab(400, 800, 6.60, 85),
      _slab(800, None, 7.50, 110)]),

    # ---- Goa (JERC) ----
    (_discom("Goa Electricity Dept", "Goa Electricity Department", "Goa", "JERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 100, 1.50, 15), _slab(100, 200, 2.50, 25), _slab(200, 400, 3.75, 40),
      _slab(400, None, 5.00, 65)]),

    # ---- Gujarat (GERC) ----
    (_discom("UGVCL", "Uttar Gujarat Vij Co Ltd", "Gujarat", "GERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 2.50, 20), _slab(50, 100, 3.05, 25), _slab(100, 200, 3.50, 40),
      _slab(200, 300, 4.15, 55), _slab(300, 500, 4.80, 70), _slab(500, None, 5.50, 90)]),

    (_discom("PGVCL", "Paschim Gujarat Vij Co Ltd", "Gujarat", "GERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 2.50, 20), _slab(50, 100, 3.05, 25), _slab(100, 200, 3.50, 40),
      _slab(200, 300, 4.15, 55), _slab(300, 500, 4.80, 70), _slab(500, None, 5.50, 90)]),

    (_discom("MGVCL", "Madhya Gujarat Vij Co Ltd", "Gujarat", "GERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 2.50, 20), _slab(50, 100, 3.05, 25), _slab(100, 200, 3.50, 40),
      _slab(200, 300, 4.15, 55), _slab(300, 500, 4.80, 70), _slab(500, None, 5.50, 90)]),

    (_discom("DGVCL", "Dakshin Gujarat Vij Co Ltd", "Gujarat", "GERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 2.50, 20), _slab(50, 100, 3.05, 25), _slab(100, 200, 3.50, 40),
      _slab(200, 300, 4.15, 55), _slab(300, 500, 4.80, 70), _slab(500, None, 5.50, 90)]),

    # ---- Haryana (HERC) ----
    (_discom("UHBVNL", "Uttar Haryana Bijli Vitran Nigam Ltd", "Haryana", "HERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.20),
     [_slab(0, 50, 2.00, 25), _slab(50, 100, 3.50, 35), _slab(100, 300, 5.25, 55),
      _slab(300, 500, 6.30, 75), _slab(500, None, 7.10, 100)]),

    (_discom("DHBVNL", "Dakshin Haryana Bijli Vitran Nigam Ltd", "Haryana", "HERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.20),
     [_slab(0, 50, 2.00, 25), _slab(50, 100, 3.50, 35), _slab(100, 300, 5.25, 55),
      _slab(300, 500, 6.30, 75), _slab(500, None, 7.10, 100)]),

    # ---- Himachal Pradesh (HPERC) ----
    (_discom("HPSEB", "Himachal Pradesh State Electricity Board Ltd", "Himachal Pradesh", "HPERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 60, 2.00, 15), _slab(60, 125, 3.25, 30), _slab(125, 300, 4.15, 45),
      _slab(300, 500, 5.00, 60), _slab(500, None, 5.75, 80)]),

    # ---- Jharkhand (JSERC) ----
    (_discom("JBVNL", "Jharkhand Bijli Vitran Nigam Ltd", "Jharkhand", "JSERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.50, 20), _slab(50, 100, 3.80, 30), _slab(100, 200, 4.90, 50),
      _slab(200, 400, 5.90, 65), _slab(400, None, 6.80, 85)]),

    # ---- Karnataka (KERC) ----
    (_discom("BESCOM", "Bangalore Electricity Supply Co Ltd", "Karnataka", "KERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 3.75, 30), _slab(50, 100, 4.70, 40), _slab(100, 200, 5.90, 55),
      _slab(200, 500, 7.00, 75), _slab(500, None, 7.90, 100)]),

    (_discom("MESCOM", "Mangalore Electricity Supply Co Ltd", "Karnataka", "KERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 3.55, 25), _slab(50, 100, 4.50, 35), _slab(100, 200, 5.70, 50),
      _slab(200, 500, 6.80, 70), _slab(500, None, 7.70, 95)]),

    (_discom("HESCOM", "Hubli Electricity Supply Co Ltd", "Karnataka", "KERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 3.55, 25), _slab(50, 100, 4.50, 35), _slab(100, 200, 5.70, 50),
      _slab(200, 500, 6.80, 70), _slab(500, None, 7.70, 95)]),

    (_discom("GESCOM", "Gulbarga Electricity Supply Co Ltd", "Karnataka", "KERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 3.55, 25), _slab(50, 100, 4.50, 35), _slab(100, 200, 5.70, 50),
      _slab(200, 500, 6.80, 70), _slab(500, None, 7.70, 95)]),

    (_discom("CESC Mysore", "Chamundeshwari Electricity Supply Corp Ltd", "Karnataka", "KERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 3.55, 25), _slab(50, 100, 4.50, 35), _slab(100, 200, 5.70, 50),
      _slab(200, 500, 6.80, 70), _slab(500, None, 7.70, 95)]),

    # ---- Kerala (KSERC) ----
    (_discom("KSEB", "Kerala State Electricity Board Ltd", "Kerala", "KSERC",
             electricity_duty_pct=10.0, fuel_surcharge=0.0),
     [_slab(0, 50, 2.80, 30), _slab(50, 100, 3.55, 40), _slab(100, 150, 4.80, 55),
      _slab(150, 200, 6.30, 70), _slab(200, 300, 6.90, 85), _slab(300, None, 7.50, 100)]),

    # ---- Madhya Pradesh (MPERC) ----
    (_discom("MP West", "MP Paschim Kshetra Vidyut Vitaran Co Ltd", "Madhya Pradesh", "MPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.80, 20), _slab(50, 100, 3.90, 30), _slab(100, 200, 5.00, 50),
      _slab(200, 300, 6.00, 65), _slab(300, None, 6.80, 80)]),

    (_discom("MP Central", "MP Madhya Kshetra Vidyut Vitaran Co Ltd", "Madhya Pradesh", "MPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.80, 20), _slab(50, 100, 3.90, 30), _slab(100, 200, 5.00, 50),
      _slab(200, 300, 6.00, 65), _slab(300, None, 6.80, 80)]),

    (_discom("MP East", "MP Poorv Kshetra Vidyut Vitaran Co Ltd", "Madhya Pradesh", "MPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.80, 20), _slab(50, 100, 3.90, 30), _slab(100, 200, 5.00, 50),
      _slab(200, 300, 6.00, 65), _slab(300, None, 6.80, 80)]),

    # ---- Maharashtra (MERC) ----
    (_discom("MSEDCL", "Maharashtra State Electricity Distribution Co Ltd", "Maharashtra", "MERC",
             electricity_duty_pct=16.0, fuel_surcharge=0.23),
     [_slab(0, 100, 3.84, 45), _slab(100, 300, 7.36, 100), _slab(300, 500, 9.36, 155),
      _slab(500, None, 11.36, 200)]),

    (_discom("Tata Power Mumbai", "Tata Power Co Ltd (Mumbai)", "Maharashtra", "MERC",
             has_tou=True, electricity_duty_pct=16.0, fuel_surcharge=0.20),
     [_slab(0, 100, 3.50, 40), _slab(100, 300, 5.50, 80), _slab(300, 500, 7.80, 130),
      _slab(500, None, 9.90, 175),
      _slab(0, None, 10.50, 0, True, "18:00", "22:00")]),

    (_discom("Adani Electricity", "Adani Electricity Mumbai Ltd", "Maharashtra", "MERC",
             has_tou=True, electricity_duty_pct=16.0, fuel_surcharge=0.18),
     [_slab(0, 100, 3.60, 40), _slab(100, 300, 5.70, 85), _slab(300, 500, 8.00, 135),
      _slab(500, None, 10.10, 180),
      _slab(0, None, 10.70, 0, True, "18:00", "22:00")]),

    (_discom("BEST", "Brihanmumbai Electric Supply & Transport", "Maharashtra", "MERC",
             electricity_duty_pct=16.0, fuel_surcharge=0.15),
     [_slab(0, 100, 3.20, 35), _slab(100, 300, 5.30, 75), _slab(300, 500, 7.50, 120),
      _slab(500, None, 9.50, 165)]),

    # ---- Manipur (MSERC) ----
    (_discom("MSPCL", "Manipur State Power Co Ltd", "Manipur", "MSERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 50, 2.50, 15), _slab(50, 100, 3.30, 20), _slab(100, 200, 4.40, 35),
      _slab(200, None, 5.50, 50)]),

    # ---- Meghalaya (MeSERC) ----
    (_discom("MeECL", "Meghalaya Energy Corp Ltd", "Meghalaya", "MeSERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 100, 2.60, 20), _slab(100, 200, 3.40, 30), _slab(200, 400, 4.50, 45),
      _slab(400, None, 5.60, 60)]),

    # ---- Mizoram (JERC) ----
    (_discom("Mizoram P&E Dept", "Mizoram Power & Electricity Dept", "Mizoram", "JERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 100, 3.00, 15), _slab(100, 200, 4.00, 25), _slab(200, None, 5.00, 40)]),

    # ---- Nagaland (NERC) ----
    (_discom("Nagaland DoP", "Nagaland Dept of Power", "Nagaland", "NERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.0),
     [_slab(0, 50, 2.20, 15), _slab(50, 100, 3.40, 25), _slab(100, 200, 4.40, 40),
      _slab(200, None, 5.30, 55)]),

    # ---- Odisha (OERC) ----
    (_discom("TPCODL", "TP Central Odisha Distribution Ltd", "Odisha", "OERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.00, 20), _slab(50, 200, 3.50, 35), _slab(200, 400, 5.20, 55),
      _slab(400, None, 6.50, 75)]),

    (_discom("TPNODL", "TP Northern Odisha Distribution Ltd", "Odisha", "OERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.00, 20), _slab(50, 200, 3.50, 35), _slab(200, 400, 5.20, 55),
      _slab(400, None, 6.50, 75)]),

    (_discom("TPWODL", "TP Western Odisha Distribution Ltd", "Odisha", "OERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.00, 20), _slab(50, 200, 3.50, 35), _slab(200, 400, 5.20, 55),
      _slab(400, None, 6.50, 75)]),

    (_discom("TPSODL", "TP Southern Odisha Distribution Ltd", "Odisha", "OERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 50, 2.00, 20), _slab(50, 200, 3.50, 35), _slab(200, 400, 5.20, 55),
      _slab(400, None, 6.50, 75)]),

    # ---- Punjab (PSERC) ----
    (_discom("PSPCL", "Punjab State Power Corp Ltd", "Punjab", "PSERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.12),
     [_slab(0, 100, 3.07, 25), _slab(100, 300, 5.07, 50), _slab(300, 500, 6.15, 75),
      _slab(500, None, 6.87, 100)]),

    # ---- Rajasthan (RERC) ----
    (_discom("JVVNL", "Jaipur Vidyut Vitran Nigam Ltd", "Rajasthan", "RERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 3.85, 25), _slab(50, 150, 5.45, 40), _slab(150, 300, 6.00, 60),
      _slab(300, 500, 6.50, 80), _slab(500, None, 7.00, 100)]),

    (_discom("AVVNL", "Ajmer Vidyut Vitran Nigam Ltd", "Rajasthan", "RERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 3.85, 25), _slab(50, 150, 5.45, 40), _slab(150, 300, 6.00, 60),
      _slab(300, 500, 6.50, 80), _slab(500, None, 7.00, 100)]),

    (_discom("JdVVNL", "Jodhpur Vidyut Vitran Nigam Ltd", "Rajasthan", "RERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.15),
     [_slab(0, 50, 3.85, 25), _slab(50, 150, 5.45, 40), _slab(150, 300, 6.00, 60),
      _slab(300, 500, 6.50, 80), _slab(500, None, 7.00, 100)]),

    # ---- Tamil Nadu (TNERC) ----
    (_discom("TANGEDCO", "Tamil Nadu Generation and Distribution Corp Ltd", "Tamil Nadu", "TNERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.0),
     [_slab(0, 100, 0.0, 0), _slab(100, 200, 2.25, 20), _slab(200, 400, 4.50, 50),
      _slab(400, 500, 6.00, 75), _slab(500, None, 7.50, 100)]),

    # ---- Telangana (TSERC) ----
    (_discom("TSSPDCL", "TS Southern Power Distribution Co Ltd", "Telangana", "TSERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.08),
     [_slab(0, 50, 1.90, 20), _slab(50, 100, 3.10, 25), _slab(100, 200, 4.80, 45),
      _slab(200, 300, 6.40, 60), _slab(300, None, 7.70, 80)]),

    (_discom("TSNPDCL", "TS Northern Power Distribution Co Ltd", "Telangana", "TSERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.08),
     [_slab(0, 50, 1.90, 20), _slab(50, 100, 3.10, 25), _slab(100, 200, 4.80, 45),
      _slab(200, 300, 6.40, 60), _slab(300, None, 7.70, 80)]),

    # ---- Tripura (TERC) ----
    (_discom("TSECL", "Tripura State Electricity Corp Ltd", "Tripura", "TERC",
             electricity_duty_pct=0.0, fuel_surcharge=0.05),
     [_slab(0, 50, 2.20, 15), _slab(50, 100, 3.20, 20), _slab(100, 200, 4.20, 35),
      _slab(200, None, 5.40, 50)]),

    # ---- Uttar Pradesh (UPERC) ----
    (_discom("DVVNL", "Dakshinanchal Vidyut Vitran Nigam Ltd", "Uttar Pradesh", "UPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.16),
     [_slab(0, 100, 3.45, 30), _slab(100, 200, 4.10, 45), _slab(200, 300, 5.00, 60),
      _slab(300, 500, 5.50, 80), _slab(500, None, 6.00, 100)]),

    (_discom("MVVNL", "Madhyanchal Vidyut Vitran Nigam Ltd", "Uttar Pradesh", "UPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.16),
     [_slab(0, 100, 3.45, 30), _slab(100, 200, 4.10, 45), _slab(200, 300, 5.00, 60),
      _slab(300, 500, 5.50, 80), _slab(500, None, 6.00, 100)]),

    (_discom("PuVVNL", "Purvanchal Vidyut Vitran Nigam Ltd", "Uttar Pradesh", "UPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.16),
     [_slab(0, 100, 3.45, 30), _slab(100, 200, 4.10, 45), _slab(200, 300, 5.00, 60),
      _slab(300, 500, 5.50, 80), _slab(500, None, 6.00, 100)]),

    (_discom("KESCO", "Kanpur Electricity Supply Co Ltd", "Uttar Pradesh", "UPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.16),
     [_slab(0, 100, 3.50, 35), _slab(100, 200, 4.20, 50), _slab(200, 300, 5.10, 65),
      _slab(300, 500, 5.60, 85), _slab(500, None, 6.10, 105)]),

    (_discom("PVVNL", "Pashchimanchal Vidyut Vitran Nigam Ltd", "Uttar Pradesh", "UPERC",
             electricity_duty_pct=5.0, fuel_surcharge=0.16),
     [_slab(0, 100, 3.45, 30), _slab(100, 200, 4.10, 45), _slab(200, 300, 5.00, 60),
      _slab(300, 500, 5.50, 80), _slab(500, None, 6.00, 100)]),

    # ---- Uttarakhand (UERC) ----
    (_discom("UPCL", "Uttarakhand Power Corp Ltd", "Uttarakhand", "UERC",
             electricity_duty_pct=3.0, fuel_surcharge=0.10),
     [_slab(0, 100, 2.80, 20), _slab(100, 200, 3.80, 35), _slab(200, 400, 4.70, 55),
      _slab(400, None, 5.50, 75)]),

    # ---- West Bengal (WBERC) ----
    (_discom("WBSEDCL", "West Bengal State Electricity Distribution Co Ltd", "West Bengal", "WBERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.12),
     [_slab(0, 25, 3.18, 20), _slab(25, 60, 4.12, 30), _slab(60, 100, 5.07, 45),
      _slab(100, 200, 6.24, 60), _slab(200, 300, 7.01, 80), _slab(300, None, 7.90, 100)]),

    (_discom("CESC Kolkata", "Calcutta Electric Supply Corp Ltd", "West Bengal", "WBERC",
             electricity_duty_pct=6.0, fuel_surcharge=0.10),
     [_slab(0, 25, 2.94, 18), _slab(25, 60, 3.92, 28), _slab(60, 100, 4.88, 42),
      _slab(100, 200, 5.98, 58), _slab(200, 300, 6.85, 78), _slab(300, None, 7.72, 98)]),
]


def get_sync_engine():
    settings = get_settings()
    return create_engine(settings.database_url_sync, echo=False)


def seed_tariffs(engine=None):
    """Insert all DISCOMs and tariff slabs. Returns (discom_count, tariff_count)."""
    if engine is None:
        engine = get_sync_engine()

    discom_count = 0
    tariff_count = 0

    with Session(engine) as session:
        # Check existing
        existing_discoms = session.execute(text("SELECT COUNT(*) FROM discoms")).scalar()
        if existing_discoms and existing_discoms >= len(DISCOM_TARIFF_DATA):
            print(f"  Tariffs already seeded ({existing_discoms} DISCOMs found). Skipping.")
            return existing_discoms, session.execute(text("SELECT COUNT(*) FROM tariffs")).scalar()

        # Clean slate
        if existing_discoms and existing_discoms > 0:
            print(f"  Clearing {existing_discoms} existing DISCOMs for reseed...")
            session.execute(text("DELETE FROM tariffs"))
            session.execute(text("DELETE FROM discoms"))
            session.commit()

        for discom_data, slabs in DISCOM_TARIFF_DATA:
            discom = Discom(**discom_data)
            session.add(discom)
            session.flush()  # get discom.id

            for slab_data in slabs:
                tariff = Tariff(
                    discom_id=discom.id,
                    category="Residential",
                    effective_from=EFFECTIVE_DATE,
                    **slab_data,
                )
                session.add(tariff)
                tariff_count += 1

            discom_count += 1
            if discom_count % 10 == 0:
                print(f"  [{discom_count}/{len(DISCOM_TARIFF_DATA)}] DISCOMs processed...")

        session.commit()
        print(f"  Done: {discom_count} DISCOMs, {tariff_count} tariff slabs created.")

    return discom_count, tariff_count


if __name__ == "__main__":
    print("=== Seeding Tariffs ===")
    d, t = seed_tariffs()
    print(f"Created {d} DISCOMs with {t} tariff slabs.")
