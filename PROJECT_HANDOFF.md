# Antigravity + DevRelay handoff

The runnable RepoRevive AI project has already been created. **Do not reinitialize or overwrite it.**

1. Open the cloned or extracted `reporevive-ai` folder in Antigravity.
2. Run frontend/backend as described in `README.md` and confirm `/api/health` and demo mode.
3. Open the terminal and run `devrelay login` (install CLI from official docs first if needed). Complete browser sign-in yourself.
4. Use DevRelay to inspect *your* specific event prizes/deadlines. Do not invent requirements.
5. Commit and push on your GitHub account. Use separate branches for parallel work.
6. Prioritize running one real repository through the analyzer, verify model output (if Ollama available), record demo, and submit.

**Team work split:** ChatGPT implements changes as patches or downloadable versions; Antigravity can integrate DevRelay and handle local verification. Avoid simultaneous edits to the same files.

## Cloud preview deployment

`.github/workflows/pages.yml` publishes the React frontend in sample-report mode through GitHub Pages whenever `main` changes. Choose **Settings → Pages → Source: GitHub Actions** in the repository. For a live cloud scan, separately deploy FastAPI and set `VITE_API_BASE_URL`; do not expose a personal machine's Ollama port to the internet.
