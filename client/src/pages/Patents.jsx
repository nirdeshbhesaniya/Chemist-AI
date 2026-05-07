import { useState } from 'react'
import toast from 'react-hot-toast'
import MoleculeInput from '../components/MoleculeInput'
import { api } from '../context/AuthContext'
import { ScrollText, Search, Shield, AlertTriangle, FileText, ExternalLink, Scale, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const riskStyle = r => r === 'low' ? { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(0,230,118,0.2)' } :
    r === 'medium' ? { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(255,149,0,0.2)' } :
        { color: 'var(--red)', bg: 'var(--red-dim)', border: 'rgba(255,77,106,0.2)' }

export default function Patents() {
    const [molecule, setMolecule] = useState('')
    const [smiles, setSmiles] = useState('')
    const [inputType, setInputType] = useState('name')
    const [motif, setMotif] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [open, setOpen] = useState({ fto: true, patents: true, recs: false })
    const toggle = k => setOpen(p => ({ ...p, [k]: !p[k] }))

    const handleMoleculeChange = (val, type) => {
        setInputType(type); if (type === 'smiles') setSmiles(val); else setMolecule(val)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!molecule && !smiles) return toast.error('Enter a molecule or compound')
        setLoading(true); setResult(null)
        try {
            const res = await api.post('/patents', { molecule, smiles, structuralMotif: motif, inputType, searchQuery: molecule || smiles })
            setResult(res.data.data)
            toast.success(`Found ${res.data.data.patentsFound} patents!`)
        } catch (err) { toast.error(err.response?.data?.error || 'Patent search failed') }
        finally { setLoading(false) }
    }

    const d = result || {}
    const analysis = d.analysis || {}
    const risk = riskStyle(analysis.riskLevel)

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'rgba(255,163,82,0.15)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <ScrollText size={32} color="#FFA352" />
                    </div>
                    <div><span className="badge" style={{ background: 'rgba(255,163,82,0.15)', color: '#FFA352', border: '1px solid rgba(255,163,82,0.3)', marginBottom: '0.35rem' }}>USE CASE 6</span><h1>Patent Analysis</h1></div>
                </div>
                <p>Freedom-to-operate analysis scanning USPTO patents for structural motifs and synthesis routes</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}><Search size={18} /><span style={{ fontWeight: 700 }}>Search Query</span></div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <MoleculeInput value={molecule} smilesValue={smiles} onChange={handleMoleculeChange} onSmilesChange={setSmiles} label="Compound / Molecule" />
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Structural Motif (optional)</label>
                                <input className="form-input" placeholder="e.g. benzimidazole ring, phosphonate group" value={motif} onChange={e => setMotif(e.target.value)} />
                                <p className="form-hint">Specific functional group or scaffold to search for</p>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? <><div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} /> Searching...</> : <><ScrollText size={18} /> Analyze Patents</>}
                            </button>
                        </form>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,149,0,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,149,0,0.15)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 600, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={14} /> Disclaimer</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>This is AI-assisted analysis using USPTO PatentsView. Consult a patent attorney for legal FTO opinions.</div>
                        </div>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div className="analyzing-icon"><ScrollText size={48} color="#FFA352" /></div>
                            <div className="analyzing-text gradient-text">Searching Patent Database</div>
                            <div className="loading-dots"><span /><span /><span /></div>
                            <div className="analyzing-subtext">Querying USPTO PatentsView + AI FTO analysis...</div>
                        </div></div>
                    )}

                    {result && !loading && (
                        <div>
                            {/* FTO Summary */}
                            <div style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <Shield size={28} color={risk.color} />
                                            <div>
                                                <div style={{ fontWeight: 700, color: risk.color, fontSize: '1.1rem' }}>Freedom-to-Operate Assessment</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USPTO PatentsView · {d.patentsFound} patents found · {d.databases?.join(', ')}</div>
                                            </div>
                                        </div>
                                        <div className="markdown-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}><ReactMarkdown>{analysis.ftoSummary}</ReactMarkdown></div>
                                    </div>
                                    <div style={{ textAlign: 'center', minWidth: 120, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Risk Level</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: risk.color, textTransform: 'uppercase' }}>{analysis.riskLevel || '—'}</div>
                                    </div>
                                </div>
                                {analysis.riskFactors?.length > 0 && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {analysis.riskFactors.map((r, i) => <span key={i} className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><AlertTriangle size={12} /> {r}</span>)}
                                    </div>
                                )}
                            </div>

                            {/* Key Patents */}
                            {d.patents?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('patents')}>
                                        <FileText size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Patents Found (USPTO)</span>
                                        <span className="badge badge-cyan">{d.patents.length}</span>
                                        <span>{open.patents ? '▲' : '▼'}</span>
                                    </div>
                                    {open.patents && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                                {d.patents.map((p, i) => (
                                                    <div key={i} style={{ padding: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <div>
                                                                <a href={p.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--cyan)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                    US{p.number} <ExternalLink size={14} />
                                                                </a>
                                                                <span className="badge badge-gray" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>{p.date}</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assignee: {p.assignee}</div>
                                                        </div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>{p.title}</div>
                                                        {p.abstract && <div className="markdown-body" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}><ReactMarkdown>{p.abstract?.slice(0, 250) + '...'}</ReactMarkdown></div>}
                                                        {/* AI analysis of this patent */}
                                                        {analysis.keyPatents?.find(kp => String(kp.number).includes(p.number)) && (() => {
                                                            const kp = analysis.keyPatents.find(k => String(k.number).includes(p.number))
                                                            return kp ? (
                                                                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: riskStyle(kp.risk).bg, borderRadius: '6px', fontSize: '0.8rem', color: riskStyle(kp.risk).color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                    <Scale size={14} /> {kp.relevance}
                                                                </div>
                                                            ) : null
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Recommendations */}
                            {(analysis.recommendations?.length > 0 || analysis.alternativeApproaches?.length > 0) && (
                                <div className="result-section">
                                    <div className="result-section-header" onClick={() => toggle('recs')}>
                                        <Lightbulb size={18} color="var(--amber)" />
                                        <span className="result-section-title">Recommendations & Alternatives</span>
                                        <span>{open.recs ? '▲' : '▼'}</span>
                                    </div>
                                    {open.recs && (
                                        <div className="result-section-body">
                                            <div className="grid-2">
                                                {analysis.recommendations?.length > 0 && (
                                                    <div>
                                                        <div className="form-label" style={{ marginBottom: '0.5rem', color: 'var(--cyan)' }}>Recommendations</div>
                                                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                            {analysis.recommendations.map((r, i) => <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {analysis.alternativeApproaches?.length > 0 && (
                                                    <div>
                                                        <div className="form-label" style={{ marginBottom: '0.5rem', color: 'var(--green)' }}>Patent-Safe Alternatives</div>
                                                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                            {analysis.alternativeApproaches.map((a, i) => <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{a}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div style={{ background: 'rgba(255,163,82,0.15)', padding: '1rem', borderRadius: '50%' }}>
                                <ScrollText size={48} color="#FFA352" />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Enter a compound to analyze patents</div>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                AI scans the USPTO patent database and provides a freedom-to-operate analysis with risk assessment.
                            </p>
                        </div></div>
                    )}
                </div>
            </div>
        </div>
    )
}
