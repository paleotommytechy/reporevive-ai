#!/usr/bin/env bash
# Run inside the unpacked reporevive-ai directory with Git and GitHub CLI installed.
set -euo pipefail
cd "$(dirname "$0")"
command -v git >/dev/null || { echo 'Install Git.'; exit 1; }
command -v gh >/dev/null || { echo 'Install GitHub CLI: https://cli.github.com/'; exit 1; }
gh auth status || { echo 'Run gh auth login, then retry.'; exit 1; }
if [ ! -d .git ]; then git init -b main; fi
git add .
if ! git diff --cached --quiet; then
  git commit -m 'feat: initial RepoRevive AI MVP with cloud preview'
fi
user="$(gh api user --jq .login)"
repo="$user/reporevive-ai"
if gh repo view "$repo" >/dev/null 2>&1; then
  if ! git remote get-url origin >/dev/null 2>&1; then git remote add origin "https://github.com/$repo.git"; fi
  git branch -M main
  git push -u origin main
else
  gh repo create reporevive-ai --public --source . --remote origin --push --description 'Evidence-backed open-source GitHub repository revival analyzer'
fi
echo "Published: https://github.com/$repo"
echo 'Next: Settings > Pages > Build and deployment > Source > GitHub Actions.'
