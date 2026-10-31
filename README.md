# RepoRevive AI

**Give forgotten code a second life.** A free, open-source GitHub repository analyzer with optional local, open-weight AI explanations.

Built as a Hacktoberfest 2026 MVP. React + TypeScript + Tailwind CSS + FastAPI + GitHub + Ollama/Qwen2.5-Coder.

## What works

- Scan a **public** GitHub repository by pasting its root HTTPS URL.
- Display its description, language, star count, last pushed date, and archived status.
- Inspect a bounded copy of its source **without executing or extracting files**.
- Detect common maintenance signals: root README, license, conventional tests, CI, contribution guide, dependency manifests, inactivity and archived status.
- Generate actionable findings, beginner/intermediate tasks, and a transparent heuristic maintenance-readiness score.
- Optionally generate explanations with the **open-weight Qwen2.5-Coder model** using local Ollama.
- See a **clearly marked fictional sample dashboard** without running the backend.
- Copy a readable summary, explore evidence paths and jump to real GitHub files for actual scans.
- Responsive dark UI with Overview, Findings and Revival Roadmap tabs.

> **Important:** RepoRevive is *not a vulnerability scanner*. Heuristic findings may be false positives. Missing files are identified using conventional paths, not proof of absence. Generated AI summaries require human verification.

## Quick start

Requirements: Node.js 20+, Python 3.11+, npm. Ollama is optional.

### 1. Run backend

```bash
cd backend
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/api/health for `{ "ok": true, ... }`.

### 2. Run frontend (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Click **Explore sample report** to reset to demo data, or enter a real URL and click **Analyze repo**.

### 3. Enable AI (optional)

Install [Ollama](https://ollama.com/) and pull the model:

```bash
ollama pull qwen2.5-coder:1.5b
ollama serve
```

On systems where Ollama is already running in the background, you do not need to start a second `ollama serve` instance. Keep **Enable Ollama AI insights** on in the web app. The default endpoint is `http://localhost:11434`.

Without a working Ollama instance, the application still returns transparent **static findings** with a visible "Ollama unavailable" status, rather than faking an AI response.

### Optional environment variables

Set these in your terminal or hosting provider before launching. FastAPI does not automatically load a `.env` file; `frontend/.env.local` is read by Vite during development.

| Name | Default | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | unset | Raises GitHub's public API rate limit. Keep private. |
| `FRONTEND_ORIGINS` | localhost:5173,127.0.0.1:5173 | Comma-separated allowed CORS origins |
| `OLLAMA_URL` | http://localhost:11434 | Ollama API endpoint; backend only |
| `OLLAMA_MODEL` | qwen2.5-coder:1.5b | Local model name |
| `VITE_API_BASE_URL` | localhost:8000 (development only) | Frontend backend URL; the static cloud preview has no backend unless configured |

## Test

```bash
cd backend
python -m unittest discover -s tests -v
```

```bash
cd frontend
npm run build
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/demo` | **Explicitly fictional** sample report |
| `POST` | `/api/analyze` | Public GitHub scan; JSON: `{ "url": "https://github.com/owner/repo", "use_ai": true }` |

Example:

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/octocat/Hello-World","use_ai":false}'
```

## Design notes & safeguards

- Only accepts `https://github.com/<owner>/<repo>` to avoid server-side arbitrary URL fetching.
- Uses fixed GitHub API and codeload hosts, caps compressed archive size at 10 MB, expanded member sizes at 45 MB, and scanned text at 100 small files.
- Inspects ZIP entries in memory and never executes repository code.
- Skips vendor/build directories and binary-looking entries. Large repositories are rejected rather than silently over-consuming resources.
- Repo content is marked as untrusted in prompts; prompts are not code execution or permission grants.
- Missing tests/CI/docs are **signals**, not certainty. The AI is restricted to grounded descriptions and is not trusted as a verified assessment.
- Only public repositories are supported. Github API may rate-limit anonymous requests.
- This is a single-user hackathon MVP. Add authenticated rate limits, background jobs, queueing, proper observability, stricter network isolation, and model isolation before a public high-traffic deployment.

## Deploying

### Quick cloud visualization — free GitHub Pages

This repository includes `.github/workflows/pages.yml`, which builds and deploys the **actual React dashboard** on each push to `main`. It hosts the static frontend with its clearly labelled fictional sample report; it does **not** host FastAPI or Ollama.

1. Create a **public** repository called `reporevive-ai` on GitHub, leaving the repository empty.
2. Push the files in this project to its `main` branch.
3. In the repository open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. In **Actions**, check the workflow named **Publish preview to GitHub Pages**. Once it succeeds, open `https://YOUR-USERNAME.github.io/reporevive-ai/`.

The Vite `base` is automatically set to `/reporevive-ai/` in the Pages build; local development uses `/`. The hosted preview does **not** contact your laptop's `localhost` address. To enable live cloud scanning, deploy the FastAPI API separately and configure `VITE_API_BASE_URL` in the frontend build, plus `FRONTEND_ORIGINS` on the backend.

The frontend can be published as a static site (`npm run build`, output `frontend/dist`). The backend can run from `backend/Dockerfile` using a DigitalOcean App Platform service. Set `VITE_API_BASE_URL` to the public API URL **at build time** and `FRONTEND_ORIGINS` to the frontend URL.

**AI hosting note:** Deploying FastAPI alone does *not* deploy Ollama. For a working hosted AI demonstration, provision and secure a separately hosted Ollama-compatible endpoint or demo locally. Never expose an unauthenticated Ollama endpoint on the internet.

## Contributing

Issues and PRs are welcome. Start with usability improvements, test coverage, more language-specific project detectors or better evidence links. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Submission preparation

- [ ] Publish this repository under your GitHub account with the MIT license (`LICENSE` and `LICENSE.md`).
- [ ] Run a **real** small public repository scan and capture the report.
- [ ] Record a 60–90 second walkthrough showing live analysis and AI status.
- [ ] Verify `OLLAMA_MODEL`, deployment, and GitHub links.
- [ ] Write a DEV post explaining the open-weight model, open-source codebase revival, and evidence-based limitations.
- [ ] Check the host's exact deadline and submit via the required platform. Login and submission require your participation.

## DevRelay integration

DevRelay is optional for the application runtime. Run `devrelay login` only in your own authenticated CLI environment (e.g., Antigravity terminal). Do not commit credentials or session files. DevRelay can assist with Hacktoberfest challenges/submission independently of the analyzer.

## License

MIT — see [LICENSE.md](LICENSE.md) (also available as [LICENSE](LICENSE) for standard GitHub license detection).

### Publish the repository in one command (GitHub CLI)

If you have Git and the [GitHub CLI](https://cli.github.com/) installed and authenticated with `gh auth login`, use `./publish-to-github.ps1` from PowerShell (or `bash publish-to-github.sh` on macOS/Linux). These scripts initialize Git if needed, create the **public** `reporevive-ai` repository in your authenticated account when it doesn't exist, and push `main`. They never store your GitHub password or personal access tokens in source files. You still need to select **GitHub Actions** under the repository's GitHub Pages settings.