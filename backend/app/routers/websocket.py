"""WebSocket — real-time consumption data stream.

Replays historical 5-min data as if it were live, sending
one reading every 5 seconds to simulate real-time updates.
"""

import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import text

from app.database import async_session

router = APIRouter()


@router.websocket("/ws/live/{user_id}")
async def live_stream(websocket: WebSocket, user_id: str):
    await websocket.accept()

    try:
        async with async_session() as db:
            # Get the user's most recent 288 readings (24 hours of 5-min data)
            result = await db.execute(
                text("""
                    SELECT timestamp, power_watts, energy_kwh, voltage,
                           current_amps, frequency
                    FROM consumption_data
                    WHERE user_id = :uid
                    ORDER BY timestamp DESC
                    LIMIT 288
                """),
                {"uid": user_id},
            )
            readings = list(reversed(result.all()))

        if not readings:
            await websocket.send_json({"error": "No data for this user"})
            await websocket.close()
            return

        # Replay readings every 5 seconds
        idx = 0
        while True:
            r = readings[idx % len(readings)]
            await websocket.send_json({
                "timestamp": datetime.now().isoformat(),
                "originalTimestamp": r.timestamp.isoformat(),
                "powerWatts": round(r.power_watts, 2),
                "energyKwh": round(r.energy_kwh, 4),
                "voltage": round(r.voltage, 1) if r.voltage else None,
                "currentAmps": round(r.current_amps, 3) if r.current_amps else None,
                "frequency": round(r.frequency, 2) if r.frequency else None,
            })
            idx += 1
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()
