"""
ML Analytics & Intelligence API Routes (Proxy to Render ML Service).
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Request, status
import httpx

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ml_service import MLService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["ML Analytics"])

async def _proxy_request(request: Request, method: str, path: str, params: dict = None, json: dict = None):
    if not settings.ML_SERVICE_URL:
        raise HTTPException(status_code=503, detail="ML Service URL is not configured.")
    
    url = f"{settings.ML_SERVICE_URL.rstrip('/')}{path}"
    headers = {"Authorization": request.headers.get("Authorization", "")}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.warning(f"Proxy request to {path} failed: {e}")
        raise e


@router.get("/demand-forecast")
async def get_demand_forecast(
    request: Request,
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get 7-day demand forecast for menu items (with local fallback).
    """
    if settings.ML_SERVICE_URL:
        try:
            return await _proxy_request(request, "GET", "/analytics/demand-forecast", params={"days": days})
        except Exception:
            pass

    service = MLService(db)
    return await service.get_demand_forecast(days=days)


@router.get("/customer-segments")
async def get_customer_segmentation(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get customer segmentation breakdown using RFM + K-Means Clustering (with local fallback).
    """
    if settings.ML_SERVICE_URL:
        try:
            return await _proxy_request(request, "GET", "/analytics/customer-segments")
        except Exception:
            pass

    service = MLService(db)
    return await service.get_customer_segmentation()


@router.get("/anomalies")
async def get_anomalies(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get operational waste anomalies (with local fallback).
    """
    if settings.ML_SERVICE_URL:
        try:
            return await _proxy_request(request, "GET", "/analytics/anomalies")
        except Exception:
            pass

    service = MLService(db)
    return await service.get_anomalies()
