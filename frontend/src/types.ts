export type Severity = 'high' | 'medium' | 'low'
export interface Finding {
  id: string
  title: string
  detail: string
  severity: Severity
  category: string
  evidence: string[]
  action: string
}
export interface Task {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate'
  evidence: string[]
}
export interface RepoInfo {
  full_name: string
  description: string | null
  url: string
  stars: number
  language: string | null
  last_push: string | null
  archived: boolean
  default_branch: string
}
export interface AIInsights {
  status: 'complete' | 'unavailable' | 'skipped'
  model: string
  summary: string | null
  architecture: string | null
  next_step: string | null
  note: string | null
}
export interface AnalysisResponse {
  source: 'github' | 'sample'
  repo: RepoInfo
  score: number
  files_scanned: number
  total_files: number
  partial_scan: boolean
  findings: Finding[]
  tasks: Task[]
  important_files: string[]
  signals: Record<string, boolean>
  ai: AIInsights
}
