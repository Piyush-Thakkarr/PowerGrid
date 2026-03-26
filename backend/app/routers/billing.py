"""Billing endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user
from app.services import billing_service as svc

router = APIRouter()


@router.get("/calculate")
async def calculate_bill(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2019, le=2030),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.calculate_bill(db, user.id, month, year)


@router.get("/history")
async def bill_history(
    months: int = Query(6, ge=1, le=24),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.get_bill_history(db, user.id, months)
