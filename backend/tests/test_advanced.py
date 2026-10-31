import unittest
from pydantic import ValidationError

from app.advanced import AskRequest, _evidence_answer, _evidence_kit, build_architecture
from app.github_client import RepositorySnapshot
from app.models import RepoInfo


class AdvancedFeatureTests(unittest.TestCase):
    def setUp(self):
        self.snapshot = RepositorySnapshot(
            repo=RepoInfo(
                full_name="owner/documentation",
                url="https://github.com/owner/documentation",
                description="Example public documentation project",
                default_branch="main",
            ),
            paths=[
                "README.md", "package.json", "frontend/package.json",
                "frontend/src/App.tsx", "frontend/src/Nav.tsx",
                "backend/main.py", "backend/requirements.txt",
                "docs/guide.md",
            ],
            text_files={"README.md": "Setup is described here", "package.json": "{}"},
            partial=False,
        )

    def test_architecture_uses_real_paths_only(self):
        nodes = build_architecture(self.snapshot.paths)
        frontend = next(node for node in nodes if node.label == "frontend")
        self.assertEqual(frontend.file_count, 3)
        self.assertIn("frontend/src/App.tsx", frontend.paths)
        self.assertEqual(sum(node.file_count for node in nodes), len(self.snapshot.paths))

    def test_architecture_empty_repository(self):
        self.assertEqual(build_architecture([]), [])

    def test_fallback_kit_is_honestly_labeled(self):
        kit = _evidence_kit(self.snapshot, ["No conventional test files detected", "No contribution guide detected"])
        self.assertEqual(kit["source"], "rules")
        self.assertIsNone(kit["model"])
        self.assertIn("owner/documentation", kit["contributing_md"])
        self.assertIn("frontend/package.json", kit["contributing_md"])
        self.assertIn("No conventional test files detected", kit["roadmap_md"])
        self.assertGreaterEqual(len(kit["issues"]), 1)
        self.assertIn("not AI-generated", kit["notice"])

    def test_evidence_chat_does_not_claim_ai(self):
        answer = _evidence_answer(self.snapshot, "Where do I begin?")
        self.assertEqual(answer["mode"], "rules")
        self.assertIn("Gemma 4 is temporarily unavailable", answer["answer"])
        self.assertTrue(all(path in self.snapshot.paths for path in answer["evidence"]))

    def test_question_validation_limits_input(self):
        with self.assertRaises(ValidationError):
            AskRequest(url=self.snapshot.repo.url, question="x")
        with self.assertRaises(ValidationError):
            AskRequest(url=self.snapshot.repo.url, question="x" * 400)


if __name__ == "__main__":
    unittest.main()
