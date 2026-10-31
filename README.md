# RepoRevive AI

> **Live cloud preview:** https://reporevive-ai.vercel.app/  
> The public deployment demonstrates the React dashboard using explicitly labeled sample data. Live GitHub scans need a deployed FastAPI backend; AI insights use hosted Gemma 4 through the Gemini API when GEMINI_API_KEY is configured.

**Give forgotten code a second life.** A free, open-source GitHub repository analyzer with hosted Gemma 4 AI explanations.

Built as a Hacktoberfest 2026 MVP. React + TypeScript + Tailwind CSS + FastAPI + GitHub + Gemma 4 (with optional Ollama fallback).

## What works

- Scan a **public** GitHub repository by pasting its root HTTPS URL.
- Display its description, language, star count, last pushed date, and archived status.
- Inspect a bounded copy of its source **without executing or extracting files**.
- Detect common maintenance signals: root README, license, conventional tests, CI, contribution guide, dependency manifests, inactivity and archived status.
- Generate actionable findings, beginner/intermediate tasks, and a transparent heuristic maintenance-readiness score.
- Generate explanations with **Gemma 4** through the **Gemini API** using a server-side API key (or optionally Qwen2.5-Coder via local Ollama).
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

### 3. Enable cloud AI — no local model installation required

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). In the **backend hosting dashboard**, add a secret environment variable named `GEMINI_API_KEY` with its value. Never commit or paste the actual key into source code, README, Vite variables, browser JavaScript, or screenshots.

The default model is `gemma-4-26b-a4b-it`, a Google open-weight Gemma 4 model hosted by the Gemini API. This model currently has a free API tier subject to quota. Set `AI_PROVIDER=gemma` (default).

To analyze public GitHub repositories online, also deploy the FastAPI backend and set the **frontend build variable** `VITE_API_BASE_URL` to its public HTTPS URL. Redeploy the Vite frontend after setting the variable. No API key belongs in the Vite frontend.

**Optional local alternative:** Set `AI_PROVIDER=ollama`, install Ollama, and run `ollama pull qwen2.5-coder:1.5b`. This is not required when using the hosted Gemma API.

### Optional environment variables

Set these in your terminal or hosting provider before launching. FastAPI does not automatically load a `.env` file; `frontend/.env.local` is read by Vite during development.

| Name | Default | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | unset | Raises GitHub's public API rate limit. Keep private. |
| `FRONTEND_ORIGINS` | localhost:5173,127.0.0.1:5173 | Comma-separated allowed CORS origins |
| `AI_PROVIDER` | gemma | `gemma` (cloud, recommended) or `ollama` (optional local) |\n| `GEMINI_API_KEY` | unset | **Server-side secret** for the hosted Gemma 4 Gemini API |\n| `GEMMA_MODEL` | gemma-4-26b-a4b-it | Hosted Gemma 4 model ID |\n| `OLLAMA_URL` | http://localhost:11434 | Optional local Ollama endpoint; backend only |
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

**AI hosting note:** No Ollama server is needed for the cloud version: the hosted backend calls Gemma 4 through the Gemini API using a securely stored `GEMINI_API_KEY`. The API key must never be prefixed `VITE_`. Add request rate limits and abuse protection before public high-traffic use.

## Contributing

Issues and PRs are welcome. Start with usability improvements, test coverage, more language-specific project detectors or better evidence links. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Submission preparation

- [ ] Publish this repository under your GitHub account with the MIT license (`LICENSE` and `LICENSE.md`).
- [ ] Run a **real** small public repository scan and capture the report.
- [ ] Record a 60–90 second walkthrough showing live analysis and AI status.
- [ ] Verify `GEMINI_API_KEY` is set on the backend host, that a live scan returns `ai.status=complete`, and that the GitHub links work.
- [ ] Write a DEV post explaining the open-weight model, open-source codebase revival, and evidence-based limitations.
- [ ] Check the host's exact deadline and submit via the required platform. Login and submission require your participation.

## DevRelay integration

DevRelay is optional for the application runtime. Run `devrelay login` only in your own authenticated CLI environment (e.g., Antigravity terminal). Do not commit credentials or session files. DevRelay can assist with Hacktoberfest challenges/submission independently of the analyzer.

## License

MIT — see [LICENSE.md](LICENSE.md) (also available as [LICENSE](LICENSE) for standard GitHub license detection).

### Publish the repository in one command (GitHub CLI)

If you have Git and the [GitHub CLI](https://cli.github.com/) installed and authenticated with `gh auth login`, use `./publish-to-github.ps1` from PowerShell (or `bash publish-to-github.sh` on macOS/Linux). These scripts initialize Git if needed, create the **public** `reporevive-ai` repository in your authenticated account when it doesn't exist, and push `main`. They never store your GitHub password or personal access tokens in source files. You still need to select **GitHub Actions** under the repository's GitHub Pages settings.


### Deploy the backend using Render

A `render.yaml` Blueprint is included. In [Render](https://dashboard.render.com/blueprints), connect this GitHub repository and deploy the web service. In Render service environment settings, add `GEMINI_API_KEY` as a **secret** and redeploy. Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health` to verify that the API is running.

Next, in the existing Vercel frontend project, set **Build environment variable** `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com` and redeploy the frontend. Use a real public GitHub URL to verify a live scan with `ai.status=complete`.

The Gemini API's Gemma 4 tier is currently free up to provider rate limits. The Render free backend can sleep when idle, adding cold-start latency. If no provider key is configured, real GitHub maintenance checks still work, but AI insights will visibly report `unavailable`.
