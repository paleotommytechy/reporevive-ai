import io
import unittest
from zipfile import ZipFile

from app.analyzer import analyze_snapshot
from app.github_client import GitHubError, RepositorySnapshot, inspect_archive, parse_github_url
from app.models import RepoInfo


class InputTests(unittest.TestCase):
    def test_valid_github_url(self):
        self.assertEqual(parse_github_url("https://github.com/microsoft/vscode"), ("microsoft", "vscode"))
        self.assertEqual(parse_github_url("https://github.com/org/repo.git"), ("org", "repo"))

    def test_reject_untrusted_urls(self):
        for raw in ["http://github.com/a/b", "https://github.com.evil.com/a/b", "https://evil.com/a/b", "https://github.com/a/b/tree/main", "https://github.com/a/b?secret=1", "https://user:pass@github.com/a/b", "https://github.com/a/../b"]:
            with self.subTest(raw=raw), self.assertRaises(GitHubError):
                parse_github_url(raw)

    def test_archive_filters_files(self):
        stream = io.BytesIO()
        with ZipFile(stream, "w") as archive:
            archive.writestr("repo-main/README.md", "A small tool")
            archive.writestr("repo-main/package.json", '{"name":"demo"}')
            archive.writestr("repo-main/node_modules/x.js", "ignore")
            archive.writestr("repo-main/../../bad.py", "ignore")
        paths, texts, truncated = inspect_archive(stream.getvalue())
        self.assertEqual(set(texts), {"README.md", "package.json"})
        self.assertNotIn("node_modules/x.js", paths)
        self.assertFalse(truncated)


class AnalyzerTests(unittest.TestCase):
    def test_complete_project_has_high_score(self):
        snap = RepositorySnapshot(
            repo=RepoInfo(full_name="acme/ok", url="https://github.com/acme/ok"),
            paths=["README.md", "LICENSE", "CONTRIBUTING.md", "tests/test_app.py", ".github/workflows/ci.yml", "pyproject.toml"],
            text_files={"README.md": "text"}, partial=False,
        )
        result = analyze_snapshot(snap)
        self.assertEqual(result.score, 100)
        self.assertFalse(result.findings)
        self.assertTrue(result.signals["tests"])

    def test_missing_files_produce_actionable_findings(self):
        snap = RepositorySnapshot(
            repo=RepoInfo(full_name="acme/legacy", url="https://github.com/acme/legacy"),
            paths=["package.json", "src/main.ts"], text_files={"package.json": "{}"},
            partial=False,
        )
        report = analyze_snapshot(snap)
        self.assertEqual(report.source, "github")
        self.assertLess(report.score, 100)
        self.assertTrue(any(f.id == "readme" for f in report.findings))
        self.assertTrue(all(t.title for t in report.tasks))


if __name__ == "__main__":
    unittest.main()
