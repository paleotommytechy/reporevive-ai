# Run from the unpacked reporevive-ai directory in PowerShell.
# Requires Git and GitHub CLI (gh) authenticated to the GitHub account.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not installed.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI (gh) is not installed. Install it from https://cli.github.com/' }

gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first, then run this script again.' }

if (-not (Test-Path '.git')) { git init -b main }
git add .
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m 'feat: initial RepoRevive AI MVP with cloud preview'
  if ($LASTEXITCODE -ne 0) { throw 'Unable to commit. Set git config user.name and user.email.' }
}

$repo = gh api user --jq '.login'
if ($LASTEXITCODE -ne 0) { throw 'Could not determine your GitHub username.' }
$repoName = "$repo/reporevive-ai"
gh repo view $repoName *> $null
if ($LASTEXITCODE -ne 0) {
  gh repo create reporevive-ai --public --source . --remote origin --push --description 'Evidence-backed open-source GitHub repository revival analyzer'
  if ($LASTEXITCODE -ne 0) { throw 'Repository creation or push failed.' }
} else {
  if (-not (git remote | Select-String -SimpleMatch 'origin')) { git remote add origin "https://github.com/$repoName.git" }
  git branch -M main
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'Git push failed.' }
}
Write-Host "Published: https://github.com/$repoName"
Write-Host 'Next: Settings > Pages > Build and deployment > Source > GitHub Actions.'
