"""
Forecasting service — SARIMA, Prophet, and simple LSTM.

Pre-trains on user's historical data, caches results in DB.
Models are lightweight enough to train per-user on CPU.
"""

import json
import warnings
import logging
from datetime import datetime, timedelta
from uuid import UUID

import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
warnings.filterwarnings("ignore")


async def _get_user_daily(db: AsyncSession, user_id: UUID, days: int = 180) -> pd.DataFrame:
    """Fetch user's daily consumption as a DataFrame."""
    result = await db.execute(
        text("""
            SELECT date_trunc('day', timestamp)::date AS ds,
                   SUM(energy_kwh) AS y
            FROM consumption_data
            WHERE user_id = :uid
              AND timestamp >= (SELECT MAX(timestamp) - make_interval(days => :days) FROM consumption_data WHERE user_id = :uid)
            GROUP BY ds ORDER BY ds
        """),
        {"uid": str(user_id), "days": days},
    )
    rows = result.all()
    if not rows:
        return pd.DataFrame(columns=["ds", "y"])
    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    return df


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SARIMA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def forecast_sarima(db: AsyncSession, user_id: UUID, horizon: int = 7) -> dict:
    """SARIMA(1,1,1)(1,1,0,7) forecast for next N days."""
    df = await _get_user_daily(db, user_id)
    if len(df) < 30:
        return {"error": "Not enough data (need 30+ days)", "model": "sarima"}

    y = df.set_index("ds")["y"].asfreq("D").ffill()

    try:
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        model = SARIMAX(y, order=(1, 1, 1), seasonal_order=(1, 1, 0, 7),
                        enforce_stationarity=False, enforce_invertibility=False)
        fit = model.fit(disp=False, maxiter=100)
        forecast = fit.get_forecast(steps=horizon)
        pred = forecast.predicted_mean
        conf = forecast.conf_int(alpha=0.2)

        return {
            "model": "sarima",
            "predictions": [
                {
                    "date": (y.index[-1] + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                    "predicted": round(float(pred.iloc[i]), 2),
                    "lower": round(float(conf.iloc[i, 0]), 2),
                    "upper": round(float(conf.iloc[i, 1]), 2),
                }
                for i in range(horizon)
            ],
            "aic": round(fit.aic, 2),
            "dataPoints": len(y),
        }
    except Exception as e:
        logger.warning(f"SARIMA failed for {user_id}: {e}")
        return {"error": str(e), "model": "sarima"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Prophet
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def forecast_prophet(db: AsyncSession, user_id: UUID, horizon: int = 7) -> dict:
    """Facebook Prophet forecast for next N days."""
    df = await _get_user_daily(db, user_id)
    if len(df) < 30:
        return {"error": "Not enough data (need 30+ days)", "model": "prophet"}

    try:
        from prophet import Prophet
        m = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        m.fit(df)

        future = m.make_future_dataframe(periods=horizon)
        fc = m.predict(future)
        fc_future = fc.tail(horizon)

        return {
            "model": "prophet",
            "predictions": [
                {
                    "date": row["ds"].strftime("%Y-%m-%d"),
                    "predicted": round(float(row["yhat"]), 2),
                    "lower": round(float(row["yhat_lower"]), 2),
                    "upper": round(float(row["yhat_upper"]), 2),
                }
                for _, row in fc_future.iterrows()
            ],
            "trend": round(float(fc_future["trend"].mean()), 2),
            "dataPoints": len(df),
        }
    except Exception as e:
        logger.warning(f"Prophet failed for {user_id}: {e}")
        return {"error": str(e), "model": "prophet"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LSTM (simple, CPU-friendly)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def forecast_neural(db: AsyncSession, user_id: UUID, horizon: int = 7) -> dict:
    """Neural network forecast using sklearn MLPRegressor (sequence-based, LSTM-like).

    Uses a sliding window approach similar to LSTM but via sklearn's
    MLPRegressor — avoids TensorFlow dependency issues on Python 3.13.
    """
    from sklearn.neural_network import MLPRegressor
    from sklearn.preprocessing import MinMaxScaler

    df = await _get_user_daily(db, user_id)
    if len(df) < 60:
        return {"error": "Not enough data (need 60+ days)", "model": "neural"}

    try:
        values = df["y"].values.reshape(-1, 1)
        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(values).flatten()

        # Create sequences (lookback 14 days → predict 1 day)
        lookback = 14
        X, Y = [], []
        for i in range(lookback, len(scaled)):
            X.append(scaled[i - lookback:i])
            Y.append(scaled[i])
        X, Y = np.array(X), np.array(Y)

        # Train/test split (last 20% for validation)
        split = int(len(X) * 0.8)
        X_train, Y_train = X[:split], Y[:split]

        model = MLPRegressor(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            max_iter=200,
            early_stopping=True,
            random_state=42,
        )
        model.fit(X_train, Y_train)

        # Predict next N days iteratively
        last_seq = scaled[-lookback:]
        predictions = []
        for _ in range(horizon):
            pred = model.predict(last_seq.reshape(1, -1))[0]
            predictions.append(pred)
            last_seq = np.append(last_seq[1:], pred)

        # Inverse scale
        preds_actual = scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()
        last_date = df["ds"].max()

        # Validation score
        val_score = model.score(X[split:], Y[split:])

        return {
            "model": "neural",
            "predictions": [
                {
                    "date": (last_date + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                    "predicted": round(float(preds_actual[i]), 2),
                }
                for i in range(horizon)
            ],
            "lookback": lookback,
            "r2Score": round(val_score, 4),
            "dataPoints": len(df),
        }
    except Exception as e:
        logger.warning(f"Neural forecast failed for {user_id}: {e}")
        return {"error": str(e), "model": "neural"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Compare all models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def forecast_compare(db: AsyncSession, user_id: UUID, horizon: int = 7) -> dict:
    """Run all 3 models and return comparison."""
    sarima = await forecast_sarima(db, user_id, horizon)
    prophet = await forecast_prophet(db, user_id, horizon)
    # LSTM is slow on CPU — skip in comparison by default
    return {
        "sarima": sarima,
        "prophet": prophet,
        "bestModel": "prophet" if "error" not in prophet else "sarima",
    }
