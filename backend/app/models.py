from typing import Literal
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=1, max_length=300)
    use_ai: bool = True


class Finding(BaseModel):
    id: str
    title: str
    detail: str
    severity: Literal["high", "medium", "low"]
    category: str
    evidence: list[str] = Field(default_factory=list)
    action: str


class Task(BaseModel):
    title: str
    description: str
    difficulty: Literal["beginner", "intermediate"]
    evidence: list[str] = Field(default_factory=list)


class RepoInfo(BaseModel):
    full_name: str
    description: str | None = None
    url: str
    stars: int = 0
    language: str | None = None
    last_push: str | None = None
    archived: bool = False
    default_branch: str = "main"


class AIInsights(BaseModel):
    status: Literal["complete", "unavailable", "skipped"] = "skipped"
    model: str = "gemma-4-26b-a4b-it"
    summary: str | None = None
    architecture: str | None = None
    next_step: str | None = None
    note: str | None = None


class AnalysisResponse(BaseModel):
    source: Literal["github"]
    repo: RepoInfo
    score: int = Field(ge=0, le=100)
    files_scanned: int
    total_files: int
    partial_scan: bool = False
    findings: list[Finding]
    tasks: list[Task]
    important_files: list[str]
    signals: dict[str, bool]
    ai: AIInsights
