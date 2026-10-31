import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ai import enrich_with_ai
from .analyzer import analyze_snapshot
from .demo import sample_report
from .github_client import GitHubError, fetch_repository
from .models import AnalyzeRequest, AnalysisResponse

app = FastAPI(title="RepoRevive AI API", version="0.1.0", description="Public GitHub maintenance-readiness analysis and optional open-weight AI insights")
origins = [url.strip() for url in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://reporevive-ai.vercel.app").split(",") if url.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "RepoRevive AI", "version": "0.1.0"}


@app.get("/api/demo", response_model=AnalysisResponse)
async def demo():
    return sample_report()


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
    try:
        snapshot = await fetch_repository(request.url)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    result = analyze_snapshot(snapshot)
    if request.use_ai:
        result.ai = await enrich_with_ai(snapshot, result)
    return result
