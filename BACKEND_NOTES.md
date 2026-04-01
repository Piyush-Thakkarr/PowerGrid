POWERGRID BACKEND NOTES
Smart Energy Monitoring Dashboard - OJT Project
================================================


FOLDER STRUCTURE
----------------

PowerGrid/
  backend/
    app/
      main.py              - fastapi app setup, middleware, mounts all routers
      config.py            - reads .env (db url, jwt secret, cors origins)
      database.py          - async sqlalchemy engine, session factory, get_db()
      dependencies.py      - jwt decode helper

      routers/             - http endpoints, one file per feature
        auth.py            - verifies supabase jwt, auto-creates user on first login
        dashboard.py       - single combined endpoint that returns all dashboard data
        billing.py         - /api/billing/calculate, /api/billing/history
        consumption.py     - stats, hourly/daily/monthly charts, heatmap
        comparison.py      - user vs state avg, national avg
        gamification.py    - achievements, challenges, leaderboard, xp
        ml.py              - forecast endpoints, anomaly detection, recommendations
        profile.py         - get/update user profile
        websocket.py       - live power draw (replays historical readings)

      services/            - business logic layer, no http stuff here
        forecast_service.py       - sarima, prophet, mlp neural network
        anomaly_service.py        - stl decomposition + isolation forest
        recommendation_service.py - energy saving tips from usage patterns
        billing_service.py        - indian tariff slab calculation
        consumption_service.py    - aggregates raw data into stats/charts
        comparison_service.py     - state-level benchmarking queries
        gamification_service.py   - xp, levels, achievements
        auth_service.py           - user creation/lookup

      models/              - sqlalchemy table definitions
        user.py            - users + user_profiles
        consumption.py     - consumption_data (main data table)
        billing.py         - bills
        tariff.py          - discoms + tariffs
        gamification.py    - achievements, challenges, leaderboard
        forecast.py        - cached forecast results
        anomaly.py         - detected anomalies

      schemas/             - pydantic validation
        auth.py            - UserResponse (camelCase output)
        profile.py         - ProfileUpdateRequest (validates state, tariff)

      seed/                - scripts that load csv data into database
        process_and_seed.py    - main pipeline: csv, resample, insert
        seed_consumption.py    - bulk insert meter readings
        seed_tariffs.py        - 50+ indian discoms with slab rates
        seed_users.py          - demo users
        seed_gamification.py   - achievements + challenges data
        run_seed.py            - cli entry point

      admin/               - sqladmin panel (optional)

    data/raw/              - real datasets, not generated
      kaggle_mathura_bareilly/
        CEEW - Smart meter data Mathura 2019.csv  (primary dataset)
        CEEW - Smart meter data Mathura 2020.csv
        CEEW - Smart meter data Bareilly 2020.csv
        CEEW - Smart meter data Bareilly 2021.csv
      kaggle_anomaly/smart_meter_data.csv
      kaggle_household_bill/electricity_bill_dataset.csv
      kaggle_statewise/TG-NPDCL_consumption_detail_commercial.csv
      iitb_residential/iitb_data.zip

    migrations/
      versions/23afa24f8a00_initial_schema.py  - creates all 13 tables

    tests/                 - 85 tests, sqlite in-memory
      conftest.py          - test db setup, fake jwt, httpx client
      test_auth.py, test_billing.py, test_consumption.py, test_ml.py etc

    .env / .env.example
    requirements-prod.txt  - what leapcell installs
    requirements.txt       - all deps including dev
    Dockerfile, docker-compose.yml, build.sh
    alembic.ini, pytest.ini

  src/                     - react frontend (vite + react 18)
    components/dashboard/  - sidebar, stat cards, tab components
    components/auth/       - login forms, oauth buttons
    context/AuthContext.jsx - supabase auth state
    hooks/                 - useDashboardData, useChartData etc
    lib/api.js             - apiFetch() with auth token
    lib/supabase.js        - supabase client init
    pages/                 - Landing, Login, Signup, Dashboard

  public/                  - static assets
  dist/                    - vite build output (auto-generated)
  node_modules/            - npm packages (auto-generated)
  supabase/                - supabase local config
  vercel.json              - spa rewrite rules
  package.json, vite.config.js, vitest.config.js



ARCHITECTURE
------------

Three layers, each only talks to the one below:

  Routers   - receive http request, validate params, call service
     |
  Services  - business logic, ml models, sql queries
     |
  Database  - supabase postgresql, 13 tables

Routers dont write sql. Services dont know about http.



DATABASE TABLES
---------------

13 tables. The main ones:

users
  id (uuid from supabase), email (unique, indexed), name, provider

user_profiles
  user_id (fk to users), household_size, state, tariff_plan, discom, xp, level

consumption_data (the big one)
  composite pk on (timestamp, user_id)
  power_watts, energy_kwh, voltage, current_amps, frequency
  index on (user_id, timestamp) -- makes all time-range queries fast

discoms
  name, state, electricity_duty_pct, fuel_surcharge_per_unit

tariffs
  linked to discoms. slab_start, slab_end (null = unlimited), rate_per_unit, fixed_charge

bills
  month, year, energy_charge, fixed_charge, duty, fuel_surcharge, total_cost, breakdown_json

gamification tables
  achievements (12 predefined), user_achievements (unlocks),
  challenges (6 active), user_challenges (progress), leaderboard (monthly ranks)

ml tables
  forecast_results (cached predictions), detected_anomalies (flagged days)



DATA PIPELINE
-------------

How raw csv becomes dashboard data:

  CEEW Mathura 2019 CSV (3.5 million rows, 3-min intervals)
  |
  process_and_seed.py reads it
  |
  Resample 3-min to 5-min intervals
    energy: SUM (total in window)
    voltage/current/frequency: AVERAGE
  |
  Pick 10 meters with most data points
  |
  Shift timestamps by +2277 days (2019 data looks like 2025-2026)
  Filter to last 6 months only
  |
  Calculate power_watts = energy_kwh x 12 x 1000
    (12 because 5-min = 1/12 hour, x 1000 for kw to w)
  |
  Batch insert 10,000 rows at a time into consumption_data
    ON CONFLICT DO NOTHING (safe to re-run)
  |
  Result: ~453,637 rows for 10 users

All queries use MAX(timestamp) as reference, not NOW(), because the data
is historical but shifted to look current.



AUTHENTICATION FLOW
-------------------

1. User logs in through supabase (google oauth, email/password, or phone otp)
2. Supabase returns a JWT with sub=user_uuid, email, aud="authenticated"
3. Frontend stores it in localStorage, sends as Authorization: Bearer header
4. Backend reads JWT header to check algorithm:
   - ES256 (newer supabase): fetch public key from supabase JWKS endpoint, verify
   - HS256 (older): verify with shared secret from .env
5. Extract user_id from "sub" claim
6. Look up user in db, if first time create User + UserProfile automatically

JWT payload looks like:
  aud: "authenticated"
  sub: "a1b2c3d4-e5f6-..."   (this is the user_id)
  email: "piyush.thakkar054@gmail.com"
  app_metadata: { provider: "google" }



SARIMA FORECAST
---------------

SARIMA = Seasonal AutoRegressive Integrated Moving Average

Parameters: SARIMA(1,1,1)(1,1,0,7)

Non-seasonal part (p,d,q) = (1,1,1):
  p=1  today depends on yesterday (1 lag autoregressive)
  d=1  model sees day-to-day changes instead of raw values, removes linear trend
  q=1  corrects for yesterday's prediction error (1 lag moving average)

Seasonal part (P,D,Q,S) = (1,1,0,7):
  P=1  this monday depends on last monday
  D=1  seasonal differencing removes the weekly pattern
  Q=0  no seasonal moving average, keeps it simple
  S=7  season length = 7 days (weekly cycle)

Why these numbers:
  electricity has clear weekday/weekend patterns. (1,1,1)(1,1,0,7) is the
  standard starting config for daily utility data. simple enough to not
  overfit on 180 days of data.

Preprocessing:
  - aggregate 5-min readings into daily kwh (sql GROUP BY date)
  - set daily frequency with asfreq("D"), forward-fill missing days
  - minimum 30 days of data

Output:
  - predicted kwh for each day (default 7 day horizon)
  - 80% confidence interval (lower and upper bounds)
  - AIC score (lower = better model fit, penalizes complexity)

Extra params: enforce_stationarity=False and enforce_invertibility=False for
numerical stability. maxiter=100 to keep it fast on serverless.



PROPHET FORECAST
----------------

Facebook/Meta's forecasting library. Treats it as curve fitting.

The model: y(t) = trend(t) + seasonality(t) + error(t)

Config:
  weekly_seasonality = True   -- the main signal, weekday vs weekend
  daily_seasonality = False   -- data is already daily totals
  yearly_seasonality = False  -- only 6 months, cant learn yearly patterns
  changepoint_prior_scale = 0.05  -- controls trend flexibility

changepoint_prior_scale is a regularization parameter. 0.05 is conservative,
keeps the trend smooth. higher values let trend bend more but risk overfitting.

How prophet differs from sarima:
  - sarima uses statistical equations, prophet does curve fitting
  - prophet handles missing data natively, sarima needs ffill
  - prophet auto-detects trend shifts (changepoints)
  - prophet is slower (bayesian optimization)

Needs 30+ days. Returns predictions with confidence bounds and trend value.



NEURAL NETWORK (MLP) FORECAST
------------------------------

Using sklearn MLPRegressor, not tensorflow/pytorch. Feedforward neural
network with sliding window approach.

Why not LSTM:
  - lstm needs tensorflow (500mb+), doesnt fit in free serverless
  - mlp with sliding window does the same thing for this data size
  - trains in seconds instead of minutes

Architecture: input(14) -> hidden(64, relu) -> hidden(32, relu) -> output(1)

Pipeline:

1. Normalize with MinMaxScaler
   Scales everything to 0-1 range. Neural networks train better normalized.

2. Create sliding window sequences (lookback = 14 days)
   days 1-14 predict day 15
   days 2-15 predict day 16
   days 3-16 predict day 17
   ...

3. Split 80/20
   First 80% trains, last 20% validates.
   No shuffling -- time series has to stay in order.

4. Train
   hidden_layer_sizes = (64, 32)
   activation = relu
   max_iter = 200
   early_stopping = True  -- stops if validation loss plateaus for 10 epochs

5. Multi-day prediction (autoregressive)
   Predict day 15 from [day1..14]
   Predict day 16 from [day2..14, predicted_day15]
   Predict day 17 from [day3..14, predicted_15, predicted_16]
   Each prediction feeds into the next. Error accumulates which is why
   max horizon = 14 days (shorter than sarima/prophet's 30).

6. Inverse transform -- convert 0-1 values back to actual kwh

Output: predictions + R2 score on validation (1.0 = perfect, 0.0 = mean).
Needs 60+ days of data.



ANOMALY DETECTION (STL + ISOLATION FOREST)
------------------------------------------

Two-stage pipeline.

Stage 1 -- STL Decomposition

STL = Seasonal-Trend decomposition using LOESS

Takes daily kwh and breaks it into:
  observed = trend + seasonal + residual

Config: STL(ts, period=7, robust=True)
  period=7: weekly cycle
  robust=True: iterative reweighting so outliers dont mess up the decomposition

Example:
  Day        Observed   Trend   Seasonal  Residual
  Monday     15 kwh  =  12.0  +  3.5    + -0.5     (normal)
  Tuesday    13 kwh  =  12.1  +  1.2    + -0.3     (normal)
  Wednesday  25 kwh  =  12.2  +  1.0    + 11.8     (huge residual = anomaly)
  Thursday   11 kwh  =  12.3  + -1.0    + -0.3     (normal)

Why decompose first:
  If you run anomaly detection on raw data, weekends get flagged because
  usage differs from weekdays. STL removes the predictable weekly pattern.
  Only the residual (unexplained part) goes to the next stage.


Stage 2 -- Isolation Forest on residuals

IsolationForest(contamination=0.05, random_state=42)

How isolation forest works:
  - builds random binary trees
  - at each node, picks random feature + random split
  - anomalies get isolated quickly (fewer splits to separate them)
  - normal points end up deep in the tree (many splits needed)
  - anomaly score = average path length across all trees
  - shorter path = more anomalous

contamination=0.05 means roughly 5% of days get flagged. user can adjust
this through the sensitivity api parameter (range 0.01 to 0.20).

For each anomaly:
  expected = trend + seasonal at that date
  actual = observed value
  deviation = (actual - expected) / expected x 100

  severity:
    deviation > 50% = high
    deviation > 25% = medium
    rest = low



DECOMPOSITION ENDPOINT
----------------------

Same STL as anomaly detection but returns the raw components for charting:
dates, observed, trend, seasonal, residual arrays.
Frontend plots these as 4 stacked charts.



PEAK HOURS
----------

Not a trained model. SQL aggregation:
  SELECT EXTRACT(HOUR FROM timestamp), AVG(power_watts)
  GROUP BY hour ORDER BY avg_watts DESC

Top 4 hours = peak, bottom 4 = off-peak. Returns 24-point hourly profile.



RECOMMENDATIONS
---------------

Rule-based, not ml. Checks 5 things:

1. Peak hours found? suggest shifting heavy appliances (10-15% savings)
2. This month > last month by 10%+? flag rising usage
3. User > state average by 20%+? suggest energy audit (15-25% savings)
4. Night usage (12am-5am) above 0.3 kwh? flag overnight waste (5-10% savings)
5. Always: raise ac by 1 degree (6-8%), unplug standby appliances (5-10%)



BILLING CALCULATION
-------------------

Indian electricity uses progressive slab tariffs. Higher brackets = more per unit.

Total bill = energy charge + fixed charge + electricity duty + fuel surcharge

Example: Maharashtra MSEDCL, 250 kwh

  slab 1:   0-100 kwh   x  4.71/unit  =  471.00
  slab 2: 100-300 kwh   x  10.29/unit =  1543.50  (only 150 units used here)
  energy charge = 2014.50

  fixed charge: 150/month
  electricity duty: 2014.50 x 16% = 322.32
  fuel surcharge: 250 x 0.33/unit = 82.50

  total = 2014.50 + 150 + 322.32 + 82.50 = Rs 2569.32

The code loops through slabs in ascending order, fills each slab up to its
width, subtracts from remaining kwh, moves to next.

50+ discoms covering all 28 indian states. each has 4-6 residential slabs.
some (delhi, mumbai) support time-of-use peak pricing.



COMBINED DASHBOARD ENDPOINT
----------------------------

Problem: backend is on leapcell serverless. each api call = cold start (5-10s).
dashboard needs 10+ pieces of data. separate calls = 50+ seconds.

Solution: single GET /api/dashboard returns everything at once. one cold start.
Frontend caches and distributes data to each tab.



LIVE POWER DRAW
---------------

Websocket endpoint fetches last 288 readings (24 hours of 5-min data) and
replays them in a loop, one every 5 seconds. watt values are real from the
ceew dataset but its replaying historical data, not a real meter.

On deployed version, websocket doesnt work (serverless cant hold connections).
Frontend falls back to setInterval with time-based values:
  5pm-10pm:  ~1800w (evening peak)
  6am-9am:   ~1200w (morning)
  10am-4pm:  ~700w (daytime)
  night:     ~400w (standby)



TESTING
-------

85 tests. Pytest with sqlite in-memory (not postgres). Fresh tables per test.
JWT tokens generated with test secret. conftest.py overrides db dependency.

  cd backend && python -m pytest -v



DEPLOYMENT
----------

Github push to main triggers both:
  - vercel auto-deploys frontend (react spa, static files)
  - leapcell auto-deploys backend (fastapi, serverless python)
  both connect to supabase postgresql (shared db)

All free tiers. Leapcell has 5-10s cold starts. Supabase 500mb limit (~87mb used).



OVERFITTING PREVENTION
-----------------------

sarima: aic penalizes model complexity, simple (1,1,1) order
prophet: changepoint_prior_scale=0.05 regularizes trend
neural: early_stopping, 80/20 split, r2 validation
isolation forest: contamination caps anomaly percentage
stl: robust=True resists outlier influence



TERMS
-----

SARIMA - seasonal arima, time series forecasting with weekly patterns
STL - seasonal-trend decomposition using loess
Isolation Forest - unsupervised anomaly detection, isolates outliers with random trees
MLP - multi-layer perceptron, feedforward neural network
LOESS - locally estimated scatterplot smoothing
MinMaxScaler - normalizes values to 0-1
AIC - akaike information criterion, model quality (lower = better)
R-squared - variance explained by model (0 to 1)
Contamination - expected anomaly fraction in isolation forest
Changepoint - where trend direction changes (prophet)
ffill - forward fill, fills gaps with last known value
Stationarity - mean and variance constant over time, needed for arima
Differencing - y'_t = y_t - y_{t-1}, removes trend
DISCOM - distribution company, state electricity provider
JWT - json web token, stateless auth
JWKS - json web key set, public keys for jwt verification
ES256 - ecdsa with p-256, asymmetric jwt signing
CTE - common table expression, reusable sql subquery
ORM - object-relational mapping (sqlalchemy)
CORS - cross-origin resource sharing
Cold start - serverless delay when function hasnt run recently
