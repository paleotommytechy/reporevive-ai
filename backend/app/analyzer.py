"""Transparent maintenance heuristics, not a vulnerability scanner."""
from datetime import datetime, timezone
from pathlib import PurePosixPath

from .github_client import RepositorySnapshot
from .models import AIInsights, AnalysisResponse, Finding, Task


def analyze_snapshot(snap: RepositorySnapshot, source: str = "github") -> AnalysisResponse:
    paths = snap.paths
    lower = [p.lower() for p in paths]
    basenames = [PurePosixPath(p).name for p in lower]
    root = [p for p in lower if "/" not in p]
    has_readme = any(p.startswith("readme") for p in root)
    has_license = any(p.startswith(("license", "copying")) for p in root)
    has_ci = any(p.startswith(".github/workflows/") for p in lower) or any(p in {".gitlab-ci.yml", ".circleci/config.yml", "azure-pipelines.yml"} for p in lower)
    has_tests = any(
        p.startswith(("tests/", "test/", "__tests__/"))
        or (PurePosixPath(p).name.startswith("test_") and p.endswith(".py"))
        or p.endswith(("_test.py", ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".test.js", ".spec.js"))
        for p in lower
    )
    has_contributing = any(p.endswith("contributing.md") for p in lower)
    has_dependencies = any(p in {"requirements.txt", "pyproject.toml", "package.json", "cargo.toml", "go.mod", "pom.xml", "build.gradle"} or p.endswith("/package.json") for p in lower)
    stale = False
    if snap.repo.last_push:
        try:
            stamp = datetime.fromisoformat(snap.repo.last_push.replace("Z", "+00:00"))
            stale = (datetime.now(timezone.utc) - stamp).days >= 365
        except ValueError:
            pass

    findings: list[Finding] = []
    tasks: list[Task] = []
    score = 100

    def add(key: str, title: str, detail: str, severity: str, category: str, action: str, evidence: list[str], deduction: int, difficulty: str = "beginner"):
        nonlocal score
        score -= deduction
        findings.append(Finding(id=key, title=title, detail=detail, severity=severity, category=category, evidence=evidence, action=action))
        tasks.append(Task(title=action, description=detail, difficulty=difficulty, evidence=evidence))

    if not has_readme:
        add("readme", "No root README found", "New contributors may struggle to understand the project and run it locally.", "high", "Documentation", "Write a README with purpose, setup and example usage", [], 19)
    if not has_license:
        add("license", "No root license file found", "The scan could not find a license file at the repository root. Check licensing before reusing the code.", "high", "Community", "Clarify the software license with the maintainer", [], 16)
    if not has_tests:
        add("tests", "No conventional test files detected", "No tests were found using common paths and naming patterns; custom tests may still exist.", "medium", "Quality", "Add a basic smoke test for a core feature", [], 14)
    if not has_ci:
        add("ci", "No common CI configuration detected", "The scan did not find standard CI configuration paths. A custom workflow may exist.", "medium", "Automation", "Add a CI workflow that runs tests on pull requests", [], 13)
    if not has_contributing:
        add("contrib", "No contribution guide detected", "Contributors may not know how to report issues or submit changes.", "low", "Community", "Add CONTRIBUTING.md with local setup and PR guidelines", [], 7)
    if stale:
        add("activity", "Repository activity appears old", "The GitHub 'last pushed' timestamp is at least one year old. This alone does not prove abandonment.", "medium", "Maintenance", "Review issues and update the maintenance roadmap", ["GitHub repository metadata: pushed_at"], 13, "intermediate")
    if snap.repo.archived:
        add("archived", "Repository is archived", "GitHub marks this project as archived and read-only. Confirm contributor permission before proposing changes.", "high", "Maintenance", "Investigate whether a maintained fork exists", ["GitHub repository metadata: archived"], 12, "intermediate")
    if not has_dependencies:
        add("manifest", "No common dependency manifest detected", "This project may use a custom build process or a language without a dependency manifest.", "low", "Setup", "Document the build and dependency installation process", [], 6)

    if not findings:
        tasks.append(Task(title="Improve beginner onboarding", description="Identify a small, documented first contribution and add a guided walkthrough.", difficulty="beginner", evidence=[p for p in paths if p.lower().startswith("readme")][:1]))

    important_files = sorted(snap.text_files.keys(), key=lambda p: (0 if p.lower().split("/")[-1].startswith("readme") else 1, p.count("/"), p))[:14]
    return AnalysisResponse(source=source, repo=snap.repo, score=max(0, score), files_scanned=len(snap.text_files), total_files=len(paths), partial_scan=snap.partial,
        findings=findings, tasks=tasks[:8], important_files=important_files,
        signals={"readme": has_readme, "license": has_license, "tests": has_tests, "ci": has_ci, "contributing": has_contributing, "dependencies": has_dependencies},
        ai=AIInsights(status="skipped", note="Rule-based analysis; no model response requested."))
