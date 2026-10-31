import { useState, type FormEvent } from 'react'
import {
  ArrowRight, ArrowUpRight, Bot, Check, ChevronDown, Copy, Download,
  FileCode2, FilePlus2, FolderGit2, GitBranch, LoaderCircle,
  MessageCircle, Network, PackageOpen, Send, Sparkles, ShieldCheck,
} from 'lucide-react'
import type { AnalysisResponse, ArchitectureNode } from './types'

export interface KitIssue { title: string; body: string; difficulty: 'beginner' | 'intermediate' }
export interface RevivalKit {
  repo: string
  model: string
  contributing_md: string
  roadmap_md: string
  issues: KitIssue[]
  notice: string
}
export interface ChatMessage {
  question: string
  answer: string
  evidence: string[]
}

function sourceLink(report: AnalysisResponse, path: string) {
  const branch = report.repo.default_branch.split('/').map(encodeURIComponent).join('/')
  const file = path.split('/').map(encodeURIComponent).join('/')
  return report.repo.url + '/blob/' + branch + '/' + file
}

function fileLinks(report: AnalysisResponse, paths: string[]) {
  return paths.map(path => (
    <a key={path} className="advanced-evidence" href={sourceLink(report, path)} target="_blank" rel="noopener noreferrer">
      <FileCode2 size={13} /> <span>{path}</span> <ArrowUpRight size={12} />
    </a>
  ))
}

async function postJson(api: string, endpoint: string, body: object): Promise<any> {
  if (!api) throw new Error('Backend URL is not configured.')
  const response = await fetch(api + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(110000),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(
    typeof result.detail === 'string' ? result.detail : 'Request failed (HTTP ' + response.status + ').'
  )
  return result
}

function saveMarkdown(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const address = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = address
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(address), 1500)
}

export function ArchitectureExplorer({ report }: { report: AnalysisResponse }) {
  const nodes = report.architecture || []
  const [selected, setSelected] = useState(nodes[0]?.id || '')
  const active: ArchitectureNode | undefined = nodes.find(node => node.id === selected) || nodes[0]
  return <div className="advanced-surface">
    <div className="advanced-head">
      <div>
        <div className="advanced-eyebrow"><Network size={14} /> SOURCE-BACKED TOPOLOGY</div>
        <h2>Repository architecture</h2>
        <p>Explore the folders discovered in the actual repository archive. Lines show folder containment, not invented code dependencies.</p>
      </div>
      <span className="advanced-tag"><GitBranch size={14} /> {report.repo.default_branch}</span>
    </div>
    {nodes.length ? <>
      <div className="arch-visual">
        <div className="arch-source"><FolderGit2 size={18} /><strong>{report.repo.full_name}</strong><small>GitHub repository</small></div>
        <div className="arch-connector" aria-hidden="true" />
        <div className="arch-node-grid">
          {nodes.map((node, i) => <button type="button" onClick={() => setSelected(node.id)}
            className={'arch-node ' + (active?.id === node.id ? 'arch-active' : '')} key={node.id}>
            <span className="arch-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="arch-node-title"><FolderGit2 size={16} /> {node.label}</span>
            <span className="arch-node-sub">{node.role} · {node.file_count} files</span>
          </button>)}
        </div>
      </div>
      {active && <div className="arch-details">
        <div className="arch-details-top"><div><span className="advanced-eyebrow">SELECTED MODULE</span><h3>{active.label}</h3><p>{active.role} — {active.file_count} indexed files</p></div><span className="advanced-tag">Verified paths</span></div>
        <div className="arch-evidence">{fileLinks(report, active.paths)}</div>
      </div>}
    </> : <p className="advanced-muted">No folder hierarchy could be determined from this scan. Try a different repository.</p>}
    <p className="advanced-disclaimer"><ShieldCheck size={15} /> The diagram comes from indexed file paths. It does not claim to identify runtime dependencies or prove architectural relationships.</p>
  </div>
}

function buildIssuesMarkdown(kit: RevivalKit) {
  return '# Proposed GitHub issues for ' + kit.repo + '\n\n' +
    kit.issues.map((issue, index) => '## ' + (index + 1) + '. ' + issue.title + '\n\n' +
      'Difficulty: ' + issue.difficulty + '\n\n' + issue.body).join('\n\n---\n\n') +
    '\n\n> These are AI-generated drafts. Verify against the repository before publishing.\n'
}

export function RevivalKitPanel({ report, api, kit, onKit }: {
  report: AnalysisResponse; api: string; kit: RevivalKit | null; onKit: (next: RevivalKit | null) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [openDoc, setOpenDoc] = useState<'guide' | 'roadmap' | 'issues'>('guide')
  const name = (report.repo.full_name.split('/')[1] || 'repository').replace(/[^a-z0-9_-]/gi, '-')

  async function generate() {
    setBusy(true)
    setError('')
    try {
      const body = await postJson(api, '/api/revival-kit', { url: report.repo.url })
      if (!body.contributing_md || !body.roadmap_md || !Array.isArray(body.issues)) throw new Error('The model did not return a complete Revival Kit.')
      onKit(body as RevivalKit)
      setOpenDoc('guide')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate a Revival Kit.')
    } finally { setBusy(false) }
  }
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
    } catch { setError('Clipboard permission is blocked. Use Download instead.') }
  }

  const docs = kit ? [
    { id: 'guide' as const, label: 'CONTRIBUTING.md', content: kit.contributing_md, name: 'CONTRIBUTING.md' },
    { id: 'roadmap' as const, label: 'Revival roadmap', content: kit.roadmap_md, name: name + '-ROADMAP.md' },
    { id: 'issues' as const, label: 'Issue drafts (' + kit.issues.length + ')', content: buildIssuesMarkdown(kit), name: name + '-ISSUES.md' },
  ] : []
  const active = docs.find(doc => doc.id === openDoc) || docs[0]

  return <div className="advanced-surface">
    <div className="advanced-head">
      <div>
        <div className="advanced-eyebrow"><Sparkles size={14} /> GEMMA 4 · ACTIONABLE OUTPUT</div>
        <h2>Generate a Revival Kit</h2>
        <p>Turn real maintenance findings into a contribution guide, reviewable GitHub issue drafts and a prioritized recovery plan.</p>
      </div>
      {kit && <span className="advanced-tag"><Check size={14} /> Kit generated</span>}
    </div>
    <div className="kit-intro">
      <div className="kit-intro-icon"><PackageOpen size={25} /></div>
      <div><strong>{report.repo.full_name}</strong><span>{report.findings.length} maintenance findings · evidence-based draft generation</span></div>
      <button className="advanced-primary" onClick={generate} disabled={busy} type="button">
        {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
        {busy ? 'Generating…' : kit ? 'Regenerate kit' : 'Generate Revival Kit'}
      </button>
    </div>
    {busy && <div className="advanced-loading"><LoaderCircle size={16} className="animate-spin" /> Gemma 4 is drafting contribution materials from the scanned source. This can take a minute.</div>}
    {error && <div className="advanced-error" role="alert">{error}</div>}
    {!kit && !busy && <div className="kit-teasers">
      <div><FilePlus2 size={19} /><strong>Contribution guide</strong><span>Setup details and contributor steps</span></div>
      <div><GitBranch size={19} /><strong>Issue drafts</strong><span>Small, practical and reviewable tasks</span></div>
      <div><ArrowRight size={19} /><strong>Recovery roadmap</strong><span>A realistic path forward</span></div>
    </div>}
    {kit && <div className="kit-body">
      <div className="kit-tabs">{docs.map(doc => <button key={doc.id} type="button" className={openDoc === doc.id ? 'active' : ''} onClick={() => setOpenDoc(doc.id)}>{doc.label}</button>)}</div>
      <div className="kit-actions">
        <span>AI-generated Markdown · review before use</span>
        <div>
          <button type="button" onClick={() => copy(active.content, openDoc)}><Copy size={14} /> {copied === openDoc ? 'Copied' : 'Copy'}</button>
          <button type="button" onClick={() => saveMarkdown(active.name, active.content)}><Download size={14} /> Download .md</button>
        </div>
      </div>
      <pre className="kit-preview">{active.content}</pre>
      <div className="kit-download-all">
        <button className="advanced-primary" type="button" onClick={() => docs.forEach(doc => saveMarkdown(doc.name, doc.content))}>
          <Download size={15} /> Download all three files
        </button>
        <span>No repository files are changed automatically.</span>
      </div>
    </div>}
    <p className="advanced-disclaimer"><ShieldCheck size={15} /> These are suggestions, not verified changes. Always review generated commands and ask maintainers before opening issues or pull requests.</p>
  </div>
}

const suggestions = [
  'Where should a beginner contributor start?',
  'How is this repository organized?',
  'What maintenance improvement matters most?',
]

export function AskGemmaPanel({ report, api, messages, onMessages }: {
  report: AnalysisResponse; api: string; messages: ChatMessage[]; onMessages: (next: ChatMessage[]) => void
}) {
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function ask(event?: FormEvent, suggested?: string) {
    event?.preventDefault()
    const prompt = (suggested || question).trim()
    if (prompt.length < 5 || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await postJson(api, '/api/ask', {
        url: report.repo.url, question: prompt,
        history: messages.slice(-3).map(item => ({ question: item.question, answer: item.answer })),
      })
      if (typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('Gemma 4 did not answer this question.')
      onMessages([...messages, { question: prompt, answer: result.answer, evidence: result.evidence || [] }])
      setQuestion('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gemma 4 could not answer your question.')
    } finally { setBusy(false) }
  }

  return <div className="advanced-surface">
    <div className="advanced-head">
      <div>
        <div className="advanced-eyebrow"><MessageCircle size={14} /> EVIDENCE-LED REPOSITORY CHAT</div>
        <h2>Ask Gemma about this codebase</h2>
        <p>Ask about the architecture, setup, or first contributions. Answers are grounded in sampled public source files.</p>
      </div>
      <span className="advanced-tag"><Bot size={14} /> Gemma 4</span>
    </div>
    <div className="ask-conversation">
      {!messages.length && <div className="ask-greeting"><div className="ask-bot"><Bot size={21} /></div><strong>What would you like to understand?</strong><p>I'm ready to help you explore {report.repo.full_name}. Select a question or type your own.</p></div>}
      {messages.map((item, i) => <div key={i} className="ask-turn">
        <div className="ask-user">{item.question}</div>
        <div className="ask-answer"><div className="ask-answer-head"><Sparkles size={15} /> Gemma 4 <span>Grounded answer</span></div><p>{item.answer}</p>
          {item.evidence.length > 0 && <div className="arch-evidence">{fileLinks(report, item.evidence)}</div>}
        </div>
      </div>)}
      {busy && <div className="advanced-loading"><LoaderCircle size={15} className="animate-spin" /> Reading repository evidence and generating an answer…</div>}
    </div>
    {!messages.length && <div className="ask-suggestions">{suggestions.map(item => <button key={item} type="button" onClick={() => void ask(undefined, item)} disabled={busy}>{item}<ArrowUpRight size={13} /></button>)}</div>}
    <form className="ask-form" onSubmit={event => void ask(event)}>
      <input aria-label="Ask Gemma a question" value={question} maxLength={350} minLength={5}
        placeholder="Ask a question about this repository…" onChange={event => setQuestion(event.target.value)} />
      <button type="submit" className="advanced-primary" disabled={busy || question.trim().length < 5}><Send size={16} /> Ask</button>
    </form>
    {error && <div className="advanced-error" role="alert">{error}</div>}
    <p className="advanced-disclaimer"><ShieldCheck size={15} /> Gemma sees a bounded, read-only sample of files. Answers can be incomplete. Verify important details in GitHub.</p>
  </div>
}
