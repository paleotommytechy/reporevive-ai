# RepoRevive AI

> **Live cloud preview:** https://reporevive-ai.vercel.app/  
> The public Vercel dashboard opens with a clean repository input and shows reports only after a live GitHub scan.

**Give forgotten code a second life.** A free, open-source GitHub repository analyzer with hosted Gemma 4 AI explanations.

Built as a Hacktoberfest 2026 MVP. React + TypeScript + Tailwind CSS + FastAPI + GitHub + Gemma 4.

## What works

- Scan a **public** GitHub repository by pasting its root HTTPS URL.
- Display its description, language, star count, last pushed date, and archived status.
- Inspect a bounded copy of its source **without executing or extracting files**.
- Detect common maintenance signals: root README, license, conventional tests, CI, contribution guide, dependency manifests, inactivity and archived status.
- Generate actionable findings, beginner/intermediate tasks, and a transparent heuristic maintenance-readiness score.
- Generate explanations with **Gemma 4** through the **Gemini API** using a server-side API key.
- Copy a readable summary, explore evidence paths and jump to real GitHub files for actual scans.
- Guided **Understand / Diagnose / Revive** modes and a one-click link to scan a real public DevDoc-AI example.
- Interactive repository architecture explorer built from observed paths and verified GitHub file links (containment hierarchy, not invented dependencies).
- **Generate Revival Kit:** draft CONTRIBUTING.md, proposed issue drafts, and prioritized roadmap, with copy/Markdown downloads.
- **Ask Gemma:** grounded repository questions with matched file evidence and conversational follow-ups.
- If additional Gemma requests fail, the kit and chat fall back to clearly labeled evidence-based guidance rather than generating fictional AI output.
- Responsive dark UI with Overview, Findings, Roadmap, Architecture, Revival Kit and Ask Gemma sections.

> **Important:** RepoRevive is *not a vulnerability scanner*. Heuristic findings may be false positives. Missing files are identified using conventional paths, not proof of absence. Generated AI summaries require human verification.

## Quick start

Requirements: Node.js 20+, Python 3.11+, npm. Cloud AI requires a server-side Gemini API key.

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

Open http://localhost:5173. Enter a public GitHub repository URL, then click **Analyze repo**. The dashboard does not display fabricated results.

### 3. Enable cloud AI — no local model installation required

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). In the **backend hosting dashboard**, add a secret environment variable named `GEMINI_API_KEY` with its value. Never commit or paste the actual key into source code, README, Vite variables, browser JavaScript, or screenshots.

The default model is `gemma-4-26b-a4b-it`, a Google open-weight model hosted through the Gemini API. Cloud inference uses the server-side `GEMINI_API_KEY` and is subject to Google API rate limits.

To analyze public GitHub repositories online, also deploy the FastAPI backend and set the **frontend build variable** `VITE_API_BASE_URL` to its public HTTPS URL. Redeploy the Vite frontend after setting the variable. No API key belongs in the Vite frontend.


### Optional environment variables

Set these in your terminal or hosting provider before launching. FastAPI does not automatically load a `.env` file; `frontend/.env.local` is read by Vite during development.

| Name | Default | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | unset | Raises GitHub's public API rate limit. Keep private. |
| `FRONTEND_ORIGINS` | localhost:5173,127.0.0.1:5173 | Comma-separated allowed CORS origins |
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
| `POST` | `/api/analyze` | Public GitHub scan; JSON: `{ "url": "https://github.com/owner/repo", "use_ai": true }` |
| `POST` | `/api/revival-kit` | Generate reviewable Markdown drafts from a public repository, using Gemma when available, evidence-based fallback otherwise. JSON: `{ "url": "https://github.com/owner/repo" }` |
| `POST` | `/api/ask` | Ask questions about a scanned public repo. JSON: `{ "url": "https://github.com/owner/repo", "question": "Where to start?", "history": [] }` |

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

This repository includes `.github/workflows/pages.yml`, which builds and deploys the **actual React dashboard** on each push to `main`. It hosts the static frontend, which stays in a clean empty state until the API is configured; it does **not** host FastAPI.

1. Create a **public** repository called `reporevive-ai` on GitHub, leaving the repository empty.
2. Push the files in this project to its `main` branch.
3. In the repository open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. In **Actions**, check the workflow named **Publish preview to GitHub Pages**. Once it succeeds, open `https://YOUR-USERNAME.github.io/reporevive-ai/`.

The Vite `base` is automatically set to `/reporevive-ai/` in the Pages build; local development uses `/`. The hosted preview does **not** contact your laptop's `localhost` address. To enable live cloud scanning, deploy the FastAPI API separately and configure `VITE_API_BASE_URL` in the frontend build, plus `FRONTEND_ORIGINS` on the backend.

The frontend is deployed on Vercel and communicates with the `reporevive-ai-api` Vercel FastAPI service via `VITE_API_BASE_URL`. The `GEMINI_API_KEY` secret belongs only to the **backend** Vercel project.

**AI hosting note:** the hosted backend calls Gemma 4 through the Gemini API using a securely stored `GEMINI_API_KEY`. The API key must never be prefixed `VITE_`. Add request rate limits and abuse protection before public high-traffic use.

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



### Running entirely on Vercel

The live deployment uses two Vercel projects connected to this GitHub repository:

- **Frontend:** [reporevive-ai.vercel.app](https://reporevive-ai.vercel.app/), Vite root directory `frontend`; production variable `VITE_API_BASE_URL=https://reporevive-ai-api.vercel.app`.
- **API:** [reporevive-ai-api.vercel.app/api/health](https://reporevive-ai-api.vercel.app/api/health), FastAPI root directory `backend`; production secret `GEMINI_API_KEY`.

The page starts with a clean input form, **not fictional/sample data**. Paste a public GitHub URL to get a real maintenance report and (if quota permits) Gemma 4 explanation. On AI failure the backend returns specific error categories such as HTTP 429, timeout, or invalid JSON; it does not invent an AI response. Large repositories are subject to scan limits.

## RepoRevive 2.0 workflow

Choose **Understand**, **Diagnose** or **Revive**, paste a real GitHub URL, and start a live scan. Visit Architecture explorer to inspect a folder hierarchy based on real source paths. Visit Revival Kit to generate Markdown documents and proposed GitHub issues, or Ask Gemma to query repository evidence. Nothing is pushed to the source repository. Always review suggested changes before publishing.

The initial scan uses Gemma 4 when the configured model is available. Additional model calls (Revival Kit and chat) can hit API quotas or provider errors. **If they fail**, the backend returns deterministic, labeled evidence-only drafts or answers with `source: "rules"` / `mode: "rules"`. Those responses must not be presented as Gemma-generated. The app's live scan still works without a successful AI response.

Safeguards: fixed GitHub URL allowlist, bounded archive parsing without code execution, short-lived in-process snapshot cache (3 minutes, up to 25 entries), and a basic per-worker request throttle (12 AI interactions/minute). **Vercel serverless workers do not share cache or rate-limit state.** Production-scale abuse prevention would require a shared rate limiter, auth and persistence.

Run `python -m unittest discover -s tests -v` from `backend` to verify architecture mapping, honest fallback generation, input validation and core scan behavior. The `Backend tests` GitHub workflow runs on pushes and pull requests.
