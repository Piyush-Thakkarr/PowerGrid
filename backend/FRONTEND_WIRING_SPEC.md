# Frontend Wiring Spec — Connecting to Real Backend APIs

## Overview

The frontend currently uses `src/lib/demoData.js` for all dashboard data (fake seeded random values).
This spec tells you exactly what to change in each file to connect to the real FastAPI backend.

**Backend URL:** `http://localhost:8000`
**All endpoints require** the Supabase JWT token in the `Authorization: Bearer <token>` header.

---

## Step 0: Create API Client

Create `src/lib/api.js`:

```js
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
```

Add to `.env`:
```
VITE_API_URL=http://localhost:8000
```

---

## Step 1: Dashboard.jsx

**Current:** Calls `generateConsumptionData()`, `generateComparisonData()`, `generateGamificationData()` from demoData.js

**Replace with:**

```js
import { apiFetch } from '../lib/api';

// Inside Dashboard component, replace useMemo data generation with:
const [data, setData] = useState(null);
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function load() {
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        apiFetch('/api/consumption/stats'),
        apiFetch('/api/consumption/monthly?months=6'),
      ]);
      setStats(statsRes);
      setData({ monthly: monthlyRes });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }
  load();
}, [user?.id]);
```

**Data mapping:**

| Frontend field | API response field | Endpoint |
|---|---|---|
| `thisMonthUnits` | `stats.thisMonthKwh` | `GET /api/consumption/stats` |
| `lastMonthUnits` | `stats.lastMonthKwh` | same |
| `monthChange` | `stats.monthChangePercent` | same |
| `liveWatts` | WebSocket `powerWatts` | `WS /ws/live/{userId}` |

---

## Step 2: OverviewTab.jsx

**Current:** Uses `data.hourly`, `data.daily`, `data.monthly` from seeded random

**Replace with:**

```js
// Fetch based on chartView
useEffect(() => {
  if (chartView === 'hourly') {
    apiFetch(`/api/consumption/hourly?date=${today}`).then(setChartData);
  } else if (chartView === 'daily') {
    apiFetch(`/api/consumption/daily?start=${weekAgo}&end=${today}`).then(setChartData);
  } else {
    apiFetch('/api/consumption/monthly?months=6').then(setChartData);
  }
}, [chartView]);
```

**Data mapping:**

| Frontend | API | Notes |
|---|---|---|
| `hourly[].time` | `hourly[].hour` | Parse ISO → "HH:00" |
| `hourly[].units` | `hourly[].kwh` | Direct |
| `daily[].day` | `daily[].date` | Parse "YYYY-MM-DD" → "Mon" |
| `daily[].units` | `daily[].kwh` | Direct |
| `monthly[].month` | `monthly[].month` | Parse "YYYY-MM" → "Jan" |
| `monthly[].units` | `monthly[].kwh` | Direct |

---

## Step 3: AnalyticsTab.jsx

**Current:** Uses same `data.hourly/daily/monthly` + `data.heatmap`

**Replace heatmap with:**

```js
apiFetch('/api/consumption/heatmap?days=30').then(setHeatmap);
```

**Heatmap mapping:**

| Frontend | API | Notes |
|---|---|---|
| `heatmap[].day` | `heatmap[].dayOfWeek` | 0=Sun, 1=Mon... map to name |
| `heatmap[].hour` | `heatmap[].hour` | 0-23 |
| `heatmap[].value` | `heatmap[].avgKwh` | Direct |

---

## Step 4: BillingTab.jsx

**Current:** Uses `calculateBill()` from demoData.js with Gujarat-only slabs

**Replace with:**

```js
const [bill, setBill] = useState(null);
useEffect(() => {
  const now = new Date();
  apiFetch(`/api/billing/calculate?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
    .then(setBill);
}, []);
```

**Data mapping:**

| Frontend | API | Notes |
|---|---|---|
| `billBreakdown.total` | `bill.totalCost` | Direct |
| `billBreakdown.breakdown[]` | `bill.breakdown[]` | `slabStart`, `slabEnd`, `units`, `rate`, `cost` |
| Fixed charges | `bill.fixedCharge` | NEW — not in old UI |
| Electricity duty | `bill.electricityDuty` | NEW |
| Fuel surcharge | `bill.fuelSurcharge` | NEW |
| State/DISCOM | `bill.state`, `bill.discom`, `bill.regulator` | NEW |

---

## Step 5: CompareTab.jsx

**Current:** Uses `generateComparisonData()` from demoData.js

**Replace with:**

```js
apiFetch('/api/comparison/').then(setComparison);
```

**Data mapping:**

| Frontend | API |
|---|---|
| `comparison.yourMonthly` | `comparison.yourMonthlyKwh` |
| `comparison.avgSimilar` | `comparison.similarHouseholdKwh` |
| `comparison.percentile` | `comparison.percentile` |
| `comparison.yourRank` | `comparison.yourRank` |
| State average | `comparison.stateAvgKwh` (NEW) |
| National average | `comparison.nationalAvgKwh` (NEW) |

---

## Step 6: RewardsTab.jsx

**Current:** Uses `generateGamificationData()` from demoData.js

**Replace with:**

```js
const [gam, setGam] = useState(null);
useEffect(() => {
  Promise.all([
    apiFetch('/api/gamification/achievements'),
    apiFetch('/api/gamification/challenges'),
    apiFetch('/api/gamification/leaderboard'),
    apiFetch('/api/gamification/xp'),
  ]).then(([ach, ch, lb, xp]) => setGam({ ...ach, challenges: ch, leaderboard: lb, ...xp }));
}, []);
```

**Data mapping:**

| Frontend | API |
|---|---|
| `gamification.xp` | `xp.xp` |
| `gamification.level` | `xp.level` |
| `gamification.badges[]` | `achievements.achievements[]` |
| `gamification.leaderboard[]` | `leaderboard[]` (rank, name, points, savingsPercent) |
| `gamification.challenges[]` | `challenges[]` (name, description, target, progress, unit) |

---

## Step 7: ProfileTab.jsx (edit save)

**Current:** Updates Supabase `profiles` table directly

**Should also call:**

```js
await apiFetch('/api/profile', {
  method: 'PUT',
  body: JSON.stringify({ name, householdSize, state, tariffPlan }),
});
```

---

## Step 8: Live Watts (WebSocket)

**Current:** `setInterval(() => setLiveWatts(random), 5000)` in Dashboard.jsx

**Replace with:**

```js
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8000/ws/live/${user.id}`);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setLiveWatts(data.powerWatts);
  };
  return () => ws.close();
}, [user?.id]);
```

---

## Step 9: NEW — ML Features (add to dashboard)

These are entirely new tabs/sections:

| Endpoint | What to build |
|---|---|
| `GET /api/ml/forecast/compare?horizon=7` | Forecast chart with SARIMA + Prophet lines |
| `GET /api/ml/anomalies` | Alert cards for unusual days |
| `GET /api/ml/decomposition` | 3-layer chart (trend + seasonal + residual) |
| `GET /api/ml/peak-hours` | Timeline showing peak/off-peak hours |
| `GET /api/ml/recommendations` | List of cards with title, description, estimated savings |

---

## API Reference (all endpoints)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/api/auth/me` | Yes | Get/create user from JWT |
| GET | `/api/profile` | Yes | Get profile |
| PUT | `/api/profile` | Yes | Update profile |
| GET | `/api/consumption/live` | Yes | Latest reading |
| GET | `/api/consumption/stats` | Yes | This month, last month, today, peak |
| GET | `/api/consumption/hourly?date=YYYY-MM-DD` | Yes | 24 hourly data points |
| GET | `/api/consumption/daily?start=...&end=...` | Yes | Daily totals |
| GET | `/api/consumption/monthly?months=6` | Yes | Monthly totals |
| GET | `/api/consumption/heatmap?days=30` | Yes | 7x24 heatmap |
| GET | `/api/billing/calculate?month=6&year=2020` | Yes | Full slab bill |
| GET | `/api/billing/history?months=6` | Yes | Bill history |
| GET | `/api/comparison/` | Yes | User vs state/national |
| GET | `/api/gamification/achievements` | Yes | All badges + status |
| GET | `/api/gamification/challenges` | Yes | Active challenges |
| POST | `/api/gamification/challenges/{id}/join` | Yes | Join challenge |
| GET | `/api/gamification/leaderboard` | Yes | Top 20 |
| GET | `/api/gamification/xp` | Yes | XP, level, progress |
| WS | `/ws/live/{user_id}` | No | Real-time stream |
| GET | `/api/ml/forecast/sarima?horizon=7` | Yes | SARIMA forecast |
| GET | `/api/ml/forecast/prophet?horizon=7` | Yes | Prophet forecast |
| GET | `/api/ml/forecast/neural?horizon=7` | Yes | Neural forecast |
| GET | `/api/ml/forecast/compare?horizon=7` | Yes | Compare models |
| GET | `/api/ml/anomalies?sensitivity=0.05` | Yes | Anomaly detection |
| GET | `/api/ml/decomposition` | Yes | STL decomposition |
| GET | `/api/ml/peak-hours?days=30` | Yes | Peak/off-peak hours |
| GET | `/api/ml/recommendations` | Yes | Personalized tips |

---

## Running the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs (Swagger UI)
