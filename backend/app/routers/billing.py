"""Billing endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import billing_service as svc

router = APIRouter()


@router.get("/calculate")
async def calculate_bill(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2019, le=2030),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # If month/year not provided, use latest data month
    if month is None or year is None:
        result = await db.execute(
            text("SELECT MAX(timestamp) FROM consumption_data WHERE user_id = :uid"),
            {"uid": str(user.id)},
        )
        latest = result.scalar()
        if latest:
            month = latest.month
            year = latest.year
        else:
            month = 1
            year = 2021

    return await svc.calculate_bill(db, user.id, month, year)


@router.get("/history")
async def bill_history(
    months: int = Query(6, ge=1, le=24),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_bill_history(db, user.id, months)
