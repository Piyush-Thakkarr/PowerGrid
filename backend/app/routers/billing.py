"""Billing endpoints."""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.routers.auth import get_current_user
from app.services import billing_service as svc

router = APIRouter()


@router.get("/calculate")
async def calculate_bill(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2019, le=2030),
    user=Depends(get_current_user),
):
    return await svc.calculate_bill(user["id"], month, year)


@router.get("/history")
async def bill_history(months: int = Query(6, ge=1, le=24), user=Depends(get_current_user)):
    return await svc.get_bill_history(user["id"], months)
