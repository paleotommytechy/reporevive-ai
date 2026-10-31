import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .advanced import (AskRequest, KitRequest, ask_gemma, build_architecture,
                       check_ai_rate_limit, generate_kit, get_snapshot)
from .ai import enrich_with_ai
from .analyzer import analyze_snapshot
from .github_client import GitHubError, fetch_repository
from .models import AnalyzeRequest, AnalysisResponse

app = FastAPI(title="RepoRevive AI API", version="0.1.0", description="Public GitHub maintenance-readiness analysis and optional open-weight AI insights")
origins = [url.strip() for url in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://reporevive-ai.vercel.app").split(",") if url.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "RepoRevive AI", "version": "0.1.0"}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
    try:
        snapshot = await get_snapshot(request.url)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    result = analyze_snapshot(snapshot)
    result.architecture = build_architecture(snapshot.paths)
    if request.use_ai:
        result.ai = await enrich_with_ai(snapshot, result)
    return result


@app.post("/api/revival-kit")
async def revival_kit(payload: KitRequest, request: Request):
    check_ai_rate_limit(request.client.host if request.client else "anonymous")
    try:
        snapshot = await get_snapshot(payload.url)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    report = analyze_snapshot(snapshot)
    return await generate_kit(snapshot, [finding.title for finding in report.findings])


@app.post("/api/ask")
async def answer_question(payload: AskRequest, request: Request):
    check_ai_rate_limit(request.client.host if request.client else "anonymous")
    try:
        snapshot = await get_snapshot(payload.url)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return await ask_gemma(snapshot, payload.question, payload.history)
