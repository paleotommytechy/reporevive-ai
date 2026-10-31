import type { AnalysisResponse } from './types'

// This sample intentionally does not impersonate a real GitHub repository scan.
export const sampleReport: AnalysisResponse = {
  source: 'sample',
  repo: {
    full_name: 'example/legacy-notes',
    description: 'Illustrative note-taking app used to demonstrate RepoRevive.',
    url: 'https://github.com/example/legacy-notes',
    stars: 124,
    language: 'TypeScript',
    last_push: '2024-03-19T09:00:00Z',
    archived: false,
    default_branch: 'main',
  },
  score: 18,
  files_scanned: 4,
  total_files: 9,
  partial_scan: false,
  signals: { readme: false, license: false, tests: false, ci: false, contributing: false, dependencies: true },
  important_files: ['package.json', 'src/App.tsx', 'src/components/Editor.tsx', 'src/lib/storage.ts'],
  findings: [
    { id: 'readme', title: 'No root README found', detail: 'New contributors may struggle to understand the project and run it locally.', severity: 'high', category: 'Documentation', action: 'Write a README with purpose, setup and example usage', evidence: [] },
    { id: 'license', title: 'No root license file found', detail: 'The scan could not find a license file at the repository root. Check licensing before reusing the code.', severity: 'high', category: 'Community', action: 'Clarify the software license with the maintainer', evidence: [] },
    { id: 'tests', title: 'No conventional test files detected', detail: 'No tests were found using common paths and naming patterns; custom tests may still exist.', severity: 'medium', category: 'Quality', action: 'Add a basic smoke test for a core feature', evidence: [] },
    { id: 'ci', title: 'No common CI configuration detected', detail: 'The scan did not find standard CI configuration paths. A custom workflow may exist.', severity: 'medium', category: 'Automation', action: 'Add a CI workflow that runs tests on pull requests', evidence: [] },
    { id: 'contrib', title: 'No contribution guide detected', detail: 'Contributors may not know how to report issues or submit changes.', severity: 'low', category: 'Community', action: 'Add CONTRIBUTING.md with local setup and PR guidelines', evidence: [] },
    { id: 'activity', title: 'Repository activity appears old', detail: "The GitHub 'last pushed' timestamp is at least one year old. This alone does not prove abandonment.", severity: 'medium', category: 'Maintenance', action: 'Review issues and update the maintenance roadmap', evidence: ['GitHub repository metadata: pushed_at'] },
  ],
  tasks: [
    { title: 'Write a README with purpose, setup and example usage', description: 'New contributors may struggle to understand the project and run it locally.', difficulty: 'beginner', evidence: [] },
    { title: 'Clarify the software license with the maintainer', description: 'Check licensing before reusing or distributing the code.', difficulty: 'beginner', evidence: [] },
    { title: 'Add a basic smoke test for a core feature', description: 'A small test improves confidence while reviving the project.', difficulty: 'beginner', evidence: [] },
    { title: 'Add a CI workflow that runs tests on pull requests', description: 'Automate basic checks when new changes are proposed.', difficulty: 'beginner', evidence: [] },
  ],
  ai: { status: 'skipped', model: 'gemma-4-26b-a4b-it', summary: null, architecture: null, next_step: null, note: 'This is fictional sample data. Analyze a real public GitHub repository for actual findings.' },
}
