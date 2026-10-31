from .analyzer import analyze_snapshot
from .github_client import RepositorySnapshot
from .models import RepoInfo, AIInsights


def sample_report():
    """Explicitly fictional sample for an offline, non-misleading UI preview."""
    snap = RepositorySnapshot(
        repo=RepoInfo(full_name="example/legacy-notes", description="Illustrative note-taking app used to demonstrate RepoRevive.", url="https://github.com/example/legacy-notes", stars=124, language="TypeScript", last_push="2024-03-19T09:00:00Z"),
        paths=["package.json", "src/App.tsx", "src/components/Editor.tsx", "src/lib/storage.ts", "src/index.css", "index.html", "tsconfig.json", "vite.config.ts", "public/favicon.svg"],
        text_files={"package.json":"{\"scripts\":{\"dev\":\"vite\"}}", "src/App.tsx":"export default function App(){ return <Editor/> }", "src/components/Editor.tsx":"export function Editor(){ return <textarea/> }", "src/lib/storage.ts":"export const save = (text: string) => localStorage.setItem('note',text);"},
        partial=False,
    )
    result = analyze_snapshot(snap, source="sample")
    result.ai = AIInsights(status="skipped", note="This is a fictional preview. Run a real repository scan to see actual AI analysis.")
    return result
