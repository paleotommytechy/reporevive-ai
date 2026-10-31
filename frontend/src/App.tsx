import { useMemo, useState, type FormEvent } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpenText, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleAlert, ClipboardCheck, Clock3, Code2, Copy,
  ExternalLink, FileCode2, FileText, GitBranch, Github, HeartHandshake, Info,
  Layers3, LayoutDashboard, Link2, ListTodo, LoaderCircle, Menu, MoonStar, Plus,
  RefreshCcw, Search, ShieldCheck, Sparkles, Star, TerminalSquare, X,
} from 'lucide-react'
import type { AnalysisResponse, Finding, Severity } from './types'
import { sampleReport } from './sample'

const API = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')
type View = 'overview' | 'findings' | 'roadmap'

function ReadinessCircle({ score }: { score: number }) {
  const label = score >= 80 ? 'Strong foundation' : score >= 55 ? 'Room to improve' : 'Needs attention'
  return <div className="readiness-ring" style={{ background: `conic-gradient(#49e8c0 0 ${score}%, #253141 ${score}% 100%)` }}>
    <div className="readiness-inside"><span className="readiness-number">{score}<span className="readiness-total">/100</span></span><span className="readiness-status">{label}</span></div>
  </div>
}

function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`severity ${severity}`}><span className="severity-dot" />{severity === 'high' ? 'High priority' : severity === 'medium' ? 'Medium' : 'Low'}</span>
}

function fileLink(report: AnalysisResponse, path: string) {
  if (report.source !== 'github') return undefined
  const branch = report.repo.default_branch.split('/').map(encodeURIComponent).join('/')
  const filepath = path.split('/').map(encodeURIComponent).join('/')
  return `${report.repo.url}/blob/${branch}/${filepath}`
}

function Evidence({ report, paths }: { report: AnalysisResponse; paths: string[] }) {
  if (!paths.length) return <span className="evidence-note">Based on absence from scanned paths</span>
  return <div className="flex flex-wrap gap-2">{paths.map(path => {
    const href = path.startsWith('GitHub repository metadata:') ? undefined : fileLink(report, path)
    return href ? <a key={path} className="evidence-chip hover:border-mint/40" href={href} target="_blank" rel="noopener noreferrer"><FileCode2 size={12} />{path}<ArrowUpRight size={11} /></a>
      : <span className="evidence-chip" key={path}><FileCode2 size={12} />{path}</span>
  })}</div>
}

function FindingRow({ finding, report, compact = false }: { finding: Finding; report: AnalysisResponse; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return <article className="finding-row">
    <button className="finding-button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
      <span className={`finding-indicator ${finding.severity}`}><CircleAlert size={19} /></span>
      <span className="min-w-0 flex-1 text-left"><span className="finding-title">{finding.title}</span><span className="finding-description">{compact ? finding.category : finding.detail}</span></span>
      <SeverityPill severity={finding.severity} />
      <ChevronDown className={`finding-chevron ${expanded ? 'rotate-180' : ''}`} size={17} />
    </button>
    {expanded && <div className="finding-details">
      {compact && <p>{finding.detail}</p>}
      <p><strong>Suggested action:</strong> {finding.action}</p>
      <Evidence report={report} paths={finding.evidence} />
    </div>}
  </article>
}

function Sidebar({ view, onView, onDemo, mobileOpen, setMobileOpen }: {
  view: View; onView: (next: View) => void; onDemo: () => void; mobileOpen: boolean; setMobileOpen: (next: boolean) => void
}) {
  const links: { id: View; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'findings', icon: ShieldCheck, label: 'Maintenance findings' },
    { id: 'roadmap', icon: ListTodo, label: 'Revival roadmap' },
  ]
  const go = (v: View) => { onView(v); setMobileOpen(false) }
  return <>
    {mobileOpen && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="logo-icon"><RefreshCcw size={24} strokeWidth={2.5} /></div><div><div className="brand-name">repo<span>revive</span><span className="brand-ai">AI</span></div><div className="brand-tagline">OPEN SOURCE INTELLIGENCE</div></div></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav">{links.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => go(id)} className={`sidebar-link ${view === id ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8} />{label}{view === id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section-label">QUICK ACTIONS</div>
      <button className="sidebar-link" onClick={() => { onDemo(); go('overview') }}><BookOpenText size={18} strokeWidth={1.8} />Explore sample report</button>
      <a className="sidebar-link" href="https://github.com" target="_blank" rel="noopener noreferrer"><Github size={18} strokeWidth={1.8} />Browse GitHub<ArrowUpRight size={13} className="ml-auto" /></a>
      <div className="sidebar-footer"><div className="footer-graphic"><div className="footer-icon"><HeartHandshake size={22} /></div><div className="footer-title">Built for the open</div><p>Because great projects deserve a second chapter.</p></div><div className="sidebar-version"><span className="live-dot" /> RepoRevive v0.1 <span className="ml-auto">MIT Licensed</span></div></div>
    </aside>
  </>
}

function App() {
  const [view, setView] = useState<View>('overview')
  const [report, setReport] = useState<AnalysisResponse>(sampleReport)
  const [url, setUrl] = useState('')
  const [useAi, setUseAi] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | Severity>('all')
  const isSample = report.source === 'sample'
  const totalIssues = report.findings.length
  const highIssues = report.findings.filter(item => item.severity === 'high').length
  const filteredFindings = useMemo(() => report.findings.filter(f => filter === 'all' || f.severity === filter), [report, filter])

  async function scan(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!API) throw new Error('Cloud preview displays sample data only. To scan GitHub repositories, run the FastAPI backend locally or configure a deployed API URL.')
      const response = await fetch(`${API}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim(), use_ai: useAi }), signal: AbortSignal.timeout(160000) })
      const body = await response.json()
      if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Unable to analyze this repository.')
      setReport(body as AnalysisResponse)
      setView('overview')
    } catch (err) {
      setError(err instanceof TypeError ? 'Cannot reach the backend. Check the cloud API deployment or start FastAPI on port 8000.' : err instanceof Error ? err.message : 'Unexpected error. Please retry.')
    } finally { setLoading(false) }
  }

  async function copyReport() {
    const lines = [
      `RepoRevive AI report: ${report.repo.full_name}`,
      `Maintenance readiness: ${report.score}/100`,
      `Source: ${isSample ? 'fictional sample preview' : report.repo.url}`,
      ...report.findings.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.action}`),
      '\nThese are automated indicators, not a complete security audit.',
    ]
    try { await navigator.clipboard.writeText(lines.join('\n')); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }
    catch { setError('Clipboard access is unavailable in this browser.') }
  }

  return <div className="app-shell">
    <Sidebar view={view} onView={setView} onDemo={() => { setReport(sampleReport); setError('') }} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    <main className="main-area">
      <header className="topbar"><div className="flex items-center gap-3"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><span className="topbar-crumb">Workspace</span><ChevronRight size={14} className="text-slate-600" /><span className="topbar-current">{view === 'overview' ? 'Overview' : view === 'findings' ? 'Maintenance findings' : 'Revival roadmap'}</span></div><div className="topbar-right"><div className="topbar-status"><span className="live-dot" /> Open-source AI toolkit</div><span className="topbar-divider" /><span className="topbar-avatar">RR</span></div></header>
      <div className="content-area">
        <div className="page-intro"><div><div className="eyebrow"><Sparkles size={13} /> YOUR OPEN-SOURCE CO-PILOT <span className="eyebrow-line" /></div><h1>Give forgotten code<br /><span>a second life.</span></h1><p>Understand any public GitHub repository, uncover maintenance gaps,<br className="desktop-break" /> and create a clear path for its next contributor.</p></div><div className="intro-ornament" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Code2 size={42} /></div><span className="orbit-spark orbit-spark-a" /><span className="orbit-spark orbit-spark-b" /></div></div>
        <form onSubmit={scan} className="search-card">
          <div className="search-heading"><div className="search-heading-left"><div className="search-mini-icon"><Github size={19} /></div><div><strong>Analyze a repository</strong><span>Paste a public GitHub URL to get started</span></div></div><span className="small-neutral"><span className="live-dot" /> LIVE GITHUB DATA</span></div>
          <div className="input-layout"><div className="url-input-wrap"><Link2 size={18} className="input-icon" /><input aria-label="GitHub repository URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" required type="url" pattern="https://github\.com/.*" /><span className="input-hint">HTTPS</span></div><button disabled={loading} type="submit" className="scan-button">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}{loading ? 'Analyzing…' : 'Analyze repo'}<ArrowRight size={17} /></button></div>
          <div className="search-bottom"><label className="ai-toggle"><input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} /><span className="switch"><span /></span><Sparkles size={13} /><span>Enable Gemma 4 AI insights</span></label><span className="search-footnote">{!API ? 'Hosted preview · Sample data only' : 'Read-only analysis · No code executed'}</span></div>
          {error && <div className="error-message" role="alert"><CircleAlert size={17} />{error}</div>}
        </form>

        <div className="results-topline"><div className="flex items-center gap-3"><span className="results-kicker">ANALYSIS REPORT</span><span className="results-rule" /></div>{isSample ? <span className="sample-label"><Info size={13} /> Fictional sample data</span> : <span className="live-label"><CheckCircle2 size={14} /> Real GitHub scan</span>}</div>
        <section className="repo-header"><div className="repo-identity"><div className="repo-large-icon"><Github size={28} /></div><div className="min-w-0"><div className="repo-subheading">REPOSITORY OVERVIEW</div><h2>{report.repo.full_name}</h2><p>{report.repo.description || 'No description provided by the repository owner.'}</p></div></div><div className="repo-header-right">{isSample ? <span className="repo-preview-pill">PREVIEW MODE</span> : <a href={report.repo.url} target="_blank" rel="noopener noreferrer" className="open-github">Open on GitHub <ExternalLink size={14} /></a>}<span className="repo-language"><span className="language-dot" />{report.repo.language || 'Unknown language'}</span><span className="repo-stars"><Star size={14} />{report.repo.stars.toLocaleString()}</span></div></section>

        {view === 'overview' && <>
          <div className="metrics-grid"><div className="metric-card score-card"><div className="metric-top"><span>Maintenance readiness</span><Activity size={18} /></div><div className="score-card-content"><ReadinessCircle score={report.score} /><div><strong>{report.score >= 80 ? 'Looking healthy' : report.score >= 55 ? 'Some work ahead' : 'Time for a revival'}</strong><p>Heuristic score based on common repository-maintenance signals.</p><span className="metric-mini-tag">NOT A SECURITY SCORE</span></div></div></div><div className="metric-card"><div className="metric-top"><span>Potential gaps</span><CircleAlert size={18} /></div><div className="metric-value">{totalIssues}<span className="metric-small"> findings</span></div><div className="metric-bottom"><span className="metric-alert-dot" />{highIssues} higher-priority items</div></div><div className="metric-card"><div className="metric-top"><span>Source files sampled</span><FileCode2 size={18} /></div><div className="metric-value">{report.files_scanned}<span className="metric-small"> files</span></div><div className="metric-bottom"><span className="text-mint">↗</span> {report.total_files} indexed paths {report.partial_scan ? '· partial sample' : ''}</div></div></div>
          <div className="overview-grid"><section className="surface-card findings-card"><div className="panel-heading"><div><div className="panel-eyebrow">WHAT NEEDS ATTENTION</div><h3>Maintenance findings</h3></div><button className="subtle-action" onClick={() => setView('findings')}>View all <ArrowRight size={15} /></button></div><div className="findings-list">{report.findings.slice(0, 4).map(item => <FindingRow finding={item} report={report} compact key={item.id} />)}{report.findings.length === 0 && <div className="empty-panel"><CheckCircle2 size={24} /><p>No common maintenance gaps detected in this scan.</p></div>}</div></section>
          <section className="surface-card status-card"><div className="panel-heading"><div><div className="panel-eyebrow">PROJECT FOUNDATIONS</div><h3>Repository signals</h3></div><ClipboardCheck size={20} className="muted-icon" /></div><div className="signal-list">{[
            ['README', 'readme'], ['Open-source license', 'license'], ['Automated tests', 'tests'], ['CI workflow', 'ci'], ['Contribution guide', 'contributing'], ['Dependency manifest', 'dependencies'],
          ].map(([label, key]) => <div className="signal-item" key={key}><span><span className={`signal-dot ${report.signals[key] ? 'present' : 'missing'}`} />{label}</span><span className={`signal-result ${report.signals[key] ? 'present' : 'missing'}`}>{report.signals[key] ? <Check size={13} /> : <X size={12} />}{report.signals[key] ? 'Detected' : 'Not found'}</span></div>)}</div><p className="panel-hint">Detection uses conventional filenames and directory names. Not definitive.</p></section></div>
          <div className="bottom-grid"><section className="surface-card ai-card"><div className="panel-heading"><div><div className="panel-eyebrow">OPEN-WEIGHT INTELLIGENCE</div><h3><Sparkles size={19} className="inline text-mint mr-2" />AI codebase insight</h3></div><span className={`ai-indicator ${report.ai.status}`}><span className="live-dot" />{report.ai.status === 'complete' ? 'MODEL RESPONDED' : report.ai.status === 'unavailable' ? 'OLLAMA UNAVAILABLE' : 'NOT RUN'}</span></div><p className="ai-summary">{report.ai.summary || (isSample ? 'This sample demonstrates the dashboard without making up an AI response. Analyze a real repository with Ollama running to generate an evidence-guided project explanation.' : report.ai.note || 'AI insights were not requested.')}</p>{report.ai.architecture && <div className="ai-extra"><strong>Architecture</strong><p>{report.ai.architecture}</p></div>}{report.ai.next_step && <div className="ai-next"><ArrowUpRight size={16} /><span>{report.ai.next_step}</span></div>}<div className="ai-footer"><div className="ai-model"><span className="model-icon"><TerminalSquare size={14} /></span>{report.ai.model}</div><span className="model-meta">OPEN-WEIGHT AI · OPTIONAL</span></div></section>
          <section className="surface-card activity-card"><div className="panel-heading"><div><div className="panel-eyebrow">REPOSITORY CONTEXT</div><h3>Project snapshot</h3></div><Layers3 size={19} className="muted-icon" /></div><div className="snapshot-row"><span><GitBranch size={16} /> Default branch</span><strong>{report.repo.default_branch}</strong></div><div className="snapshot-row"><span><Clock3 size={16} /> Last pushed</span><strong>{report.repo.last_push ? new Date(report.repo.last_push).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}</strong></div><div className="snapshot-row"><span><FileText size={16} /> Indexed paths</span><strong>{report.total_files}</strong></div><div className="snapshot-row"><span><ShieldCheck size={16} /> Archived</span><strong>{report.repo.archived ? 'Yes' : 'No'}</strong></div><button className="snapshot-cta" onClick={() => setView('roadmap')}>Explore the revival roadmap <ArrowRight size={16} /></button></section></div>
        </>}
        {view === 'findings' && <section className="surface-card full-panel"><div className="panel-heading"><div><div className="panel-eyebrow">EXPLAINABLE, EVIDENCE-LED REVIEW</div><h3>Maintenance findings <span className="heading-count">{report.findings.length}</span></h3></div><button className="outline-action" onClick={copyReport}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy report'}</button></div><p className="full-panel-caption">These are quick-scan maintenance indicators, not verified vulnerabilities. Click any finding to view a suggested action and the available evidence.</p><div className="filter-row">{(['all', 'high', 'medium', 'low'] as const).map(item => <button key={item} onClick={() => setFilter(item)} className={`filter-pill ${filter === item ? 'selected' : ''}`}>{item === 'all' ? 'All findings' : `${item[0].toUpperCase()}${item.slice(1)} priority`}</button>)}</div><div className="findings-list expanded-list">{filteredFindings.map(item => <FindingRow key={item.id} finding={item} report={report} />)}{filteredFindings.length === 0 && <div className="empty-panel"><CheckCircle2 size={24} />No matching findings</div>}</div></section>}
        {view === 'roadmap' && <div className="roadmap-grid"><section className="surface-card full-panel"><div className="panel-heading"><div><div className="panel-eyebrow">YOUR NEXT CONTRIBUTION STARTS HERE</div><h3>Revival roadmap</h3></div><span className="task-count"><ListTodo size={15} /> {report.tasks.length} suggested tasks</span></div><p className="full-panel-caption">Tasks are prioritized from detected maintenance signals. Confirm them with maintainers before opening pull requests.</p><div className="roadmap-list">{report.tasks.map((task, index) => <div className="task-row" key={`${task.title}-${index}`}><div className="task-number">{String(index + 1).padStart(2, '0')}</div><div className="task-content"><div className="task-title-row"><h4>{task.title}</h4><span className={`difficulty ${task.difficulty}`}>{task.difficulty}</span></div><p>{task.description}</p><Evidence report={report} paths={task.evidence} /></div><ArrowUpRight size={17} className="task-arrow" /></div>)}</div></section><section className="surface-card roadmap-aside"><div className="panel-eyebrow">A BETTER WAY TO CONTRIBUTE</div><h3>Small fixes.<br /><span>Big impact.</span></h3><p>Great open source gets better when the next person knows where to begin.</p><div className="roadmap-aside-icon"><Plus size={32} /></div><button onClick={copyReport} className="copy-roadmap">{copied ? 'Copied to clipboard' : 'Copy contribution plan'} {copied ? <Check size={16} /> : <Copy size={16} />}</button></section></div>}
        <footer className="content-footer"><span><MoonStar size={15} /> RepoRevive AI · An open-source Hacktoberfest project</span><span>Built with purpose, backed by evidence <ArrowDownRight size={15} /></span></footer>
      </div>
    </main>
  </div>
}
export default App
