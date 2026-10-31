# Antigravity + DevRelay handoff

The runnable RepoRevive AI project has already been created. **Do not reinitialize or overwrite it.**

1. Open the cloned or extracted `reporevive-ai` folder in Antigravity.
2. Run frontend/backend as described in `README.md` and confirm `/api/health` .
3. Open the terminal and run `devrelay login` (install CLI from official docs first if needed). Complete browser sign-in yourself.
4. Use DevRelay to inspect *your* specific event prizes/deadlines. Do not invent requirements.
5. Commit and push on your GitHub account. Use separate branches for parallel work.
6. Prioritize running one real repository through the analyzer, verify hosted Gemma 4 model output, record demo, and submit.

**Team work split:** ChatGPT implements changes as patches or downloadable versions; Antigravity can integrate DevRelay and handle local verification. Avoid simultaneous edits to the same files.

## Production deployment

Both frontend and backend deploy on Vercel automatically from `main`. The frontend uses `VITE_API_BASE_URL`, the backend uses server-only `GEMINI_API_KEY`. The live dashboard has no fictional data. Run a real public scan to demonstrate the Gemma 4 integration; follow-up AI calls may use explicitly labeled rules-based fallbacks when the provider is unavailable.
