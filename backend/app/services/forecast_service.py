"""Forecasting service — Extra Trees with feature engineering + caching.

Benchmarked winner: Extra Trees (CV MAE=1.39) beat SARIMA (1.68),
Holt-Winters (1.90), Gradient Boosting (1.45), Random Forest (1.47).
"""

import asyncio
import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.helpers import get_user_daily
from app.services.ml_cache import (
    get_cached_model, set_cached_model,
    get_cached_response, set_cached_response,
)

logger = logging.getLogger(__name__)

FEATURE_COLS = [
    "dow", "month", "day_of_month", "is_weekend",
    "lag_1", "lag_2", "lag_3", "lag_7", "lag_14",
    "roll_7_mean", "roll_7_std", "roll_14_mean", "roll_30_mean",
]


def _make_features(history, target_date) -> dict:
    import numpy as np
    return {
        "dow": target_date.dayofweek,
        "month": target_date.month,
        "day_of_month": target_date.day,
        "is_weekend": 1 if target_date.dayofweek >= 5 else 0,
        "lag_1": history[-1] if len(history) >= 1 else 0,
        "lag_2": history[-2] if len(history) >= 2 else 0,
        "lag_3": history[-3] if len(history) >= 3 else 0,
        "lag_7": history[-7] if len(history) >= 7 else 0,
        "lag_14": history[-14] if len(history) >= 14 else 0,
        "roll_7_mean": np.mean(history[-7:]) if len(history) >= 7 else np.mean(history),
        "roll_7_std": np.std(history[-7:]) if len(history) >= 7 else np.std(history),
        "roll_14_mean": np.mean(history[-14:]) if len(history) >= 14 else np.mean(history),
        "roll_30_mean": np.mean(history[-30:]) if len(history) >= 30 else np.mean(history),
    }


def _train_and_predict(values, dates, horizon, user_id):
    """Sync CPU-heavy work — runs in thread pool."""
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import ExtraTreesRegressor

    model = get_cached_model(user_id, "forecast_et")
    if model is None:
        rows = []
        for i in range(30, len(values)):
            feats = _make_features(values[:i], pd.Timestamp(dates[i]))
            feats["y"] = values[i]
            rows.append(feats)
        X = np.array([[r[c] for c in FEATURE_COLS] for r in rows])
        y = np.array([r["y"] for r in rows])
        model = ExtraTreesRegressor(n_estimators=100, max_depth=10, random_state=42)
        model.fit(X, y)
        set_cached_model(user_id, "forecast_et", model)

    history = list(values)
    last_date = pd.Timestamp(dates[-1])
    predictions = []
    for step in range(horizon):
        target_date = last_date + timedelta(days=step + 1)
        feats = _make_features(np.array(history), target_date)
        X_pred = np.array([[feats[c] for c in FEATURE_COLS]])
        pred = max(float(model.predict(X_pred)[0]), 0)
        predictions.append(pred)
        history.append(pred)

    importances = sorted(zip(FEATURE_COLS, model.feature_importances_), key=lambda x: -x[1])[:5]

    return {
        "model": "extra_trees",
        "predictions": [
            {"date": (last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"), "predicted": round(predictions[i], 2)}
            for i in range(horizon)
        ],
        "topFeatures": [{"name": f, "importance": round(float(imp), 4)} for f, imp in importances],
        "dataPoints": len(values),
        "horizon": horizon,
    }


async def forecast(db: AsyncSession, user_id: UUID, horizon: int = 7) -> dict:
    cached = get_cached_response(user_id, "forecast", horizon=horizon)
    if cached:
        return cached

    df = await get_user_daily(db, user_id)
    if len(df) < 40:
        return {"error": "Not enough data (need 40+ days)", "model": "extra_trees"}

    try:
        result = await asyncio.to_thread(_train_and_predict, df["y"].values, df["ds"].values, horizon, user_id)
        set_cached_response(user_id, "forecast", result, horizon=horizon)
        return result
    except Exception as e:
        logger.warning(f"Forecast failed for {user_id}: {e}")
        return {"error": str(e), "model": "extra_trees"}
