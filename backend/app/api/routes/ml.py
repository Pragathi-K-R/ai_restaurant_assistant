"""
ML Analytics & Intelligence API Routes (Proxy to Render ML Service).
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Request, status
import httpx

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["ML Analytics"])

async def _proxy_request(request: Request, method: str, path: str, params: dict = None, json: dict = None):
    if not settings.ML_SERVICE_URL:
        raise HTTPException(status_code=503, detail="ML Service URL is not configured.")
    
    url = f"{settings.ML_SERVICE_URL.rstrip('/')}{path}"
    headers = {"Authorization": request.headers.get("Authorization", "")}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ML Service unavailable: {str(e)}")


@router.get("/demand-forecast")
async def get_demand_forecast(
    request: Request,
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
):
    """
    Proxy: Get 7-day demand forecast for menu items using trend line regression.
    """
    return await _proxy_request(request, "GET", "/analytics/demand-forecast", params={"days": days})


@router.get("/customer-segments")
async def get_customer_segmentation(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Proxy: Get customer segmentation breakdown using RFM + K-Means Clustering.
    """
    return await _proxy_request(request, "GET", "/analytics/customer-segments")


@router.get("/anomalies")
async def get_anomalies(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Proxy: Get operational and inventory waste anomalies.
    """
    return await _proxy_request(request, "GET", "/analytics/anomalies")
