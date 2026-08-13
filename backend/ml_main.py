"""
FastAPI ML/RAG Service entry point for Render.
Serves only the ML Analytics and AI Knowledge Assistant routes.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.core.database import get_db, create_tables
from app.core.dependencies import get_current_user, bearer_scheme, oauth2_scheme
from app.core.security import verify_access_token
from app.models.user import User, UserRole

from app.services.ml_service import MLService
from app.services.ai_service import AIService
from app.core.vector_db import vector_db, KNOWLEDGE_BASE_DOCS
from app.schemas.ai import ChatRequest, ChatResponse, AILogListResponse
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_token_user(
    credentials=Depends(bearer_scheme),
    oauth2_token: str = Depends(oauth2_scheme)
) -> User:
    token = credentials.credentials if credentials else oauth2_token
    if not token:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    payload = verify_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return User(id=int(payload.get("sub")), role=payload.get("role", UserRole.STAFF))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Vector DB on startup
    try:
        vector_db.initialize()
        logger.info("ChromaDB initialized successfully")
    except Exception as e:
        logger.error(f"ChromaDB initialization failed: {e}")
    yield

app = FastAPI(title="RestaurantAI ML/RAG Service", lifespan=lifespan)

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Internal microservice, could be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddKnowledgeDocRequest(BaseModel):
    id: str = Field(..., description="Unique ID for document")
    text: str = Field(..., min_length=10, description="Content text of document or menu policy")
    category: str = Field("general", description="Category")


# --- ML Analytics Routes ---
@app.get("/analytics/demand-forecast")
async def get_demand_forecast(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_token_user),
    db: AsyncSession = Depends(get_db)
):
    service = MLService(db)
    return await service.get_demand_forecast(days=days)

@app.get("/analytics/customer-segments")
async def get_customer_segmentation(
    current_user: User = Depends(get_token_user),
    db: AsyncSession = Depends(get_db)
):
    service = MLService(db)
    return await service.get_customer_segmentation()

@app.get("/analytics/anomalies")
async def get_anomalies(
    current_user: User = Depends(get_token_user),
    db: AsyncSession = Depends(get_db)
):
    service = MLService(db)
    return await service.get_anomalies()


# --- AI Knowledge Assistant Routes ---
@app.post("/ai/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_token_user),
    db: AsyncSession = Depends(get_db)
):
    service = AIService(db)
    return await service.answer_question(user_id=current_user.id, request=request)

@app.get("/ai/history", response_model=AILogListResponse)
async def get_chat_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_token_user),
    db: AsyncSession = Depends(get_db)
):
    service = AIService(db)
    logs, total = await service.get_chat_history(user_id=current_user.id, page=page, per_page=per_page)
    return AILogListResponse(logs=logs, total=total, page=page, per_page=per_page)

@app.get("/ai/knowledge-base")
async def get_knowledge_base_documents(current_user: User = Depends(get_token_user)):
    vector_db.initialize()
    if vector_db.collection:
        try:
            count = vector_db.collection.count()
            results = vector_db.collection.get()
            docs = []
            if results and "documents" in results and results["documents"]:
                for doc_id, doc, meta in zip(results["ids"], results["documents"], results["metadatas"]):
                    docs.append({"id": doc_id, "text": doc, "metadata": meta or {}})
            return {"total": count, "documents": docs}
        except Exception:
            pass
    return {"total": len(KNOWLEDGE_BASE_DOCS), "documents": KNOWLEDGE_BASE_DOCS}

@app.post("/ai/knowledge-base")
async def add_knowledge_base_document(
    doc: AddKnowledgeDocRequest,
    current_user: User = Depends(get_token_user)
):
    vector_db.initialize()
    metadata = {"category": doc.category, "added_by": current_user.email}
    if vector_db.collection:
        try:
            vector_db.collection.add(
                ids=[doc.id],
                documents=[doc.text],
                metadatas=[metadata]
            )
            return {"status": "success", "message": "Document added to vector database", "id": doc.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to add document to vector store: {e}")

    KNOWLEDGE_BASE_DOCS.append({"id": doc.id, "text": doc.text, "metadata": metadata})
    return {"status": "success", "message": "Document added to in-memory vector store fallback", "id": doc.id}

