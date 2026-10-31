"""Read public GitHub repositories without executing or extracting their code."""
from dataclasses import dataclass
from io import BytesIO
import os
import re
from urllib.parse import quote, urlparse
import zipfile

import httpx

from .models import RepoInfo

MAX_ARCHIVE_BYTES = 10 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 45 * 1024 * 1024
MAX_FILES = 2500
MAX_FILE_BYTES = 100 * 1024
MAX_TEXT_FILES = 100
ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs", ".c", ".cpp", ".h", ".html", ".css", ".md", ".json", ".toml", ".yaml", ".yml", ".txt", ".sh", ".xml", ".php", ".rb", ".lock"}
SPECIAL_NAMES = {"dockerfile", "makefile", "license", "license.md", "license.txt", ".gitignore", "requirements.txt", "pipfile", "gemfile", "cargo.toml", "go.mod", "readme", "readme.md", "readme.rst", "contributing.md", "package.json"}
IGNORED_DIRS = {"node_modules", ".git", "dist", "build", ".next", ".venv", "venv", "__pycache__", "coverage", "vendor", ".turbo", "target", "out"}
IGNORED_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "uv.lock", "cargo.lock"}


class GitHubError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def parse_github_url(raw: str) -> tuple[str, str]:
    """Reject arbitrary hosts, paths, query parameters and URL credentials."""
    raw = raw.strip()
    parsed = urlparse(raw)
    try:
        valid_host = parsed.scheme == "https" and parsed.hostname == "github.com" and parsed.port is None
    except ValueError:
        valid_host = False
    if not valid_host:
        raise GitHubError("Enter a public repository URL such as https://github.com/owner/repo")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise GitHubError("Please use a plain GitHub repository URL without parameters.")
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if len(parts) != 2:
        raise GitHubError("Use the repository root URL, not a file or branch URL.")
    owner, repo = parts
    repo = re.sub(r"\.git$", "", repo, flags=re.I)
    if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", owner) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", repo):
        raise GitHubError("Invalid GitHub repository name.")
    if owner.startswith("-") or owner.endswith("-") or repo in {".", ".."}:
        raise GitHubError("Invalid GitHub repository name.")
    return owner, repo


@dataclass
class RepositorySnapshot:
    repo: RepoInfo
    paths: list[str]
    text_files: dict[str, str]
    partial: bool


def _priority(path: str) -> tuple[int, int, str]:
    name = path.rsplit("/", 1)[-1].lower()
    depth = path.count("/")
    if name.startswith("readme") or name in {"pyproject.toml", "package.json", "requirements.txt", "cargo.toml", "go.mod", "contributing.md"}:
        return (0, depth, path)
    if name.startswith("license") or ".github/workflows/" in path:
        return (1, depth, path)
    if name.endswith(("test.py", ".test.ts", ".spec.ts", ".test.js", ".spec.js")) or "/tests/" in path:
        return (2, depth, path)
    return (3, depth, path)


def inspect_archive(content: bytes) -> tuple[list[str], dict[str, str], bool]:
    """Inspect bounded ZIP members in memory; do not extract any files."""
    try:
        archive = zipfile.ZipFile(BytesIO(content))
    except (ValueError, zipfile.BadZipFile) as exc:
        raise GitHubError("GitHub did not return a readable repository archive.", 502) from exc

    with archive:
        entries = [i for i in archive.infolist() if not i.is_dir()]
        if len(entries) > MAX_FILES or sum(i.file_size for i in entries) > MAX_UNCOMPRESSED_BYTES:
            raise GitHubError("This repository is too large for the safe quick scan. Try a smaller one.", 413)
        paths: list[str] = []
        candidates: list[tuple[str, zipfile.ZipInfo]] = []
        for info in entries:
            bits = info.filename.replace("\\", "/").split("/")
            if len(bits) < 2:
                continue
            rel = "/".join(bits[1:])
            if not rel or rel.startswith("/") or any(p in {"..", "."} for p in rel.split("/")):
                continue
            if any(p in IGNORED_DIRS for p in rel.split("/")[:-1]):
                continue
            # UNIX symlinks are not followed and not ingested.
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                continue
            paths.append(rel)
            name = rel.rsplit("/", 1)[-1].lower()
            ext = os.path.splitext(name)[1]
            if info.file_size <= MAX_FILE_BYTES and name not in IGNORED_FILES and (ext in ALLOWED_EXTENSIONS or name in SPECIAL_NAMES):
                candidates.append((rel, info))
        candidates.sort(key=lambda x: _priority(x[0]))
        selected = candidates[:MAX_TEXT_FILES]
        text_files: dict[str, str] = {}
        for path, info in selected:
            try:
                raw = archive.read(info)
                if b"\x00" in raw[:512]:
                    continue
                decoded = raw.decode("utf-8", errors="replace")
                # Never send huge individual files to a model.
                text_files[path] = decoded[:16000]
            except (RuntimeError, ValueError, zipfile.BadZipFile):
                continue
        return paths, text_files, len(candidates) > len(selected)


async def fetch_repository(raw_url: str) -> RepositorySnapshot:
    owner, name = parse_github_url(raw_url)
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "RepoRevive-AI/0.1"}
    if os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    async with httpx.AsyncClient(timeout=httpx.Timeout(25.0), follow_redirects=False) as client:
        try:
            response = await client.get(f"https://api.github.com/repos/{owner}/{name}", headers=headers)
        except httpx.HTTPError as exc:
            raise GitHubError("Could not contact GitHub. Check your connection and retry.", 502) from exc
        if response.status_code == 404:
            raise GitHubError("Repository not found. Use a public GitHub repository URL.", 404)
        if response.status_code in (403, 429):
            raise GitHubError("GitHub API rate limit reached. Set GITHUB_TOKEN or retry later.", 429)
        if response.status_code != 200:
            raise GitHubError("GitHub couldn't load this repository right now.", 502)
        data = response.json()
        if data.get("private"):
            raise GitHubError("Only public repositories are supported.", 403)
        branch = data.get("default_branch") or "main"
        info = RepoInfo(full_name=data.get("full_name", f"{owner}/{name}"),
            description=data.get("description"), url=f"https://github.com/{owner}/{name}",
            stars=data.get("stargazers_count", 0), language=data.get("language"),
            last_push=data.get("pushed_at"), archived=bool(data.get("archived")), default_branch=branch)

    url = f"https://codeload.github.com/{quote(owner)}/{quote(name)}/zip/refs/heads/{quote(branch, safe='/')}"
    chunks: list[bytes] = []
    received = 0
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(35.0), follow_redirects=False) as client:
            async with client.stream("GET", url, headers={"User-Agent": "RepoRevive-AI/0.1"}) as resp:
                if resp.status_code != 200:
                    raise GitHubError("Could not download source files for this repository.", 502)
                async for chunk in resp.aiter_bytes():
                    received += len(chunk)
                    if received > MAX_ARCHIVE_BYTES:
                        raise GitHubError("Repository archive exceeds the 10 MB scan limit.", 413)
                    chunks.append(chunk)
    except httpx.HTTPError as exc:
        raise GitHubError("Could not download the repository archive.", 502) from exc
    paths, texts, partial = inspect_archive(b"".join(chunks))
    return RepositorySnapshot(repo=info, paths=paths, text_files=texts, partial=partial)
