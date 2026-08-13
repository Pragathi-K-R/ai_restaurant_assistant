"""
AI Knowledge Assistant API Routes (Proxy to Render ML Service).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
import httpx
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, AILogListResponse

router = APIRouter(prefix="/ai", tags=["AI Knowledge Assistant"])

class AddKnowledgeDocRequest(BaseModel):
    id: str = Field(..., description="Unique ID for document")
    text: str = Field(..., min_length=10, description="Content text of document or menu policy")
    category: str = Field("general", description="Category e.g., menu, policy, procedure")

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
        try:
            detail = e.response.json()
        except:
            detail = e.response.text
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ML Service unavailable: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request_obj: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Proxy: RAG Chat endpoint using Gemini AI & ChromaDB context.
    """
    return await _proxy_request(request, "POST", "/ai/chat", json=request_obj.model_dump())


@router.get("/history", response_model=AILogListResponse)
async def get_chat_history(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """
    Proxy: Fetch paginated chat interaction history for current user.
    """
    return await _proxy_request(request, "GET", "/ai/history", params={"page": page, "per_page": per_page})


@router.get("/knowledge-base")
async def get_knowledge_base_documents(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy: Retrieve indexed knowledge base documents in ChromaDB vector store.
    """
    return await _proxy_request(request, "GET", "/ai/knowledge-base")


@router.post("/knowledge-base")
async def add_knowledge_base_document(
    doc: AddKnowledgeDocRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy: Add a new knowledge document/policy/menu specification into the ChromaDB vector database.
    """
    return await _proxy_request(request, "POST", "/ai/knowledge-base", json=doc.model_dump())

@router.get("/status")
async def get_ai_status(current_user: User = Depends(get_current_user)):
    """
    Diagnostic endpoint to test Gemini AI configuration securely.
    """
    from app.core.config import settings
    api_key = settings.GOOGLE_API_KEY
    model = settings.GEMINI_MODEL
    
    status_report = {
        "api_key_detected": bool(api_key and api_key != "your-google-gemini-api-key-here"),
        "sdk_installed": False,
        "client_initialized": False,
        "model_configured": model,
        "test_result": "FAILED",
        "error": None
    }
    
    if not status_report["api_key_detected"]:
        status_report["error"] = "API key missing or default."
        return status_report

    try:
        from google import genai
        status_report["sdk_installed"] = True
        
        client = genai.Client(api_key=api_key)
        status_report["client_initialized"] = True
        
        # Lightweight test
        response = client.models.generate_content(
            model=model,
            contents="Return the word OK."
        )
        if response and response.text:
            status_report["test_result"] = "SUCCESS"
        else:
            status_report["error"] = "Empty response from Gemini."
            
    except ImportError:
        status_report["error"] = "google-genai SDK is not installed."
    except Exception as e:
        status_report["error"] = str(e)
        
    return status_report
