import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '../context/AuthContext'
import { History as HistoryIcon, FlaskConical, Microscope, LineChart, Network, Target, ScrollText, Inbox, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const UC_META = {
    manufacturing: { icon: <FlaskConical size={16} />, label: 'Manufacturing', color: 'var(--cyan)', badge: 'badge-cyan' },
    optimize: { icon: <Microscope size={16} />, label: 'Optimizer', color: 'var(--purple)', badge: 'badge-purple' },
    properties: { icon: <LineChart size={16} />, label: 'Properties', color: 'var(--amber)', badge: 'badge-amber' },
    retrosynthesis: { icon: <Network size={16} />, label: 'Retrosynthesis', color: 'var(--green)', badge: 'badge-green' },
    predict: { icon: <Target size={16} />, label: 'Prediction', color: '#FF6B9D', badge: '' },
    patents: { icon: <ScrollText size={16} />, label: 'Patents', color: '#FFA352', badge: '' },
}

const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

const StructuredViewer = ({ data }) => {
    if (data === null || data === undefined) return <span style={{color:'var(--text-muted)'}}>None</span>;
    if (typeof data === 'boolean') return <span className={`badge ${data ? 'badge-green' : 'badge-gray'}`}>{data ? 'Yes' : 'No'}</span>;
    if (typeof data === 'number') return <span className="font-mono" style={{color: 'var(--cyan)'}}>{data}</span>;
    if (typeof data === 'string') return <div className="markdown-body" style={{fontSize:'0.85rem'}}><ReactMarkdown>{data}</ReactMarkdown></div>;
    
    if (Array.isArray(data)) {
        if (data.length === 0) return <span style={{color:'var(--text-muted)'}}>Empty list</span>;
        if (typeof data[0] === 'string' || typeof data[0] === 'number') {
            return (
                <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem'}}>
                    {data.map((item, i) => <span key={i} className="badge badge-gray">{item}</span>)}
                </div>
            );
        }
        return (
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.25rem'}}>
                {data.map((item, i) => (
                    <div key={i} style={{padding:'0.75rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'var(--radius-sm)'}}>
                        <StructuredViewer data={item} />
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop:'0.25rem' }}>
            {Object.entries(data).map(([k, v]) => (
                <div key={k} style={{ background:'var(--bg-input)', padding:'0.75rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700, marginBottom:'0.35rem' }}>{formatKey(k)}</div>
                    <StructuredViewer data={v} />
                </div>
            ))}
        </div>
    );
};

export default function History() {
    const [history, setHistory] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [total, setTotal] = useState(0)
    const [selected, setSelected] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detail, setDetail] = useState(null)

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const params = filter !== 'all' ? `?useCase=${filter}` : ''
            const [histRes, statsRes] = await Promise.all([
                api.get(`/history${params}`),
                api.get('/history/user/stats')
            ])
            setHistory(histRes.data.history || [])
            setTotal(histRes.data.total || 0)
            setStats(statsRes.data)
        } catch { toast.error('Failed to load history') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchHistory() }, [filter])

    const handleDelete = async (id) => {
        if (!confirm('Delete this query from history?')) return
        try {
            await api.delete(`/history/${id}`)
            toast.success('Query deleted')
            setHistory(prev => prev.filter(h => h._id !== id))
            if (selected === id) { setSelected(null); setDetail(null) }
        } catch { toast.error('Delete failed') }
    }

    const handleViewDetail = async (id) => {
        if (selected === id) { setSelected(null); setDetail(null); return }
        setSelected(id); setDetailLoading(true)
        try {
            const res = await api.get(`/history/${id}`)
            setDetail(res.data.data)
        } catch { toast.error('Failed to load detail') }
        finally { setDetailLoading(false) }
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <HistoryIcon size={32} color="var(--text-primary)" />
                    <div><h1>Query History</h1></div>
                </div>
                <p>All your AI chemistry queries saved for reference</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                    <div className="metric-card">
                        <div className="metric-label">Total Queries</div>
                        <div className="metric-value gradient-text">{stats.total}</div>
                    </div>
                    {stats.byUseCase?.slice(0, 3).map(s => {
                        const meta = UC_META[s._id] || { icon: <FlaskConical size={16} />, label: s._id }
                        return (
                            <div key={s._id} className="metric-card">
                                <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>{meta.icon} {meta.label}</div>
                                <div className="metric-value" style={{ color: meta.color || 'var(--cyan)' }}>{s.count}</div>
                                <div className="metric-sub">queries</div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {['all', ...Object.keys(UC_META)].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {f === 'all' ? <><HistoryIcon size={14} /> All</> : <>{UC_META[f].icon} {UC_META[f].label}</>}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div className="loading-dots" style={{ justifyContent: 'center' }}><span /><span /><span /></div>
                    <div style={{ marginTop: '1rem' }}>Loading history...</div>
                </div>
            ) : history.length === 0 ? (
                <div className="glass-card"><div className="analyzing-container">
                    <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '50%' }}>
                        <Inbox size={48} color="var(--text-secondary)" />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>No queries yet</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Run an AI analysis to see your history here.</p>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {history.map(h => {
                        const meta = UC_META[h.useCase] || { icon: <FlaskConical size={16} />, label: h.useCase }
                        const isSelected = selected === h._id
                        return (
                            <div key={h._id} style={{ background: isSelected ? 'rgba(0,212,255,0.04)' : 'var(--bg-card)', border: `1px solid ${isSelected ? 'var(--cyan-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => handleViewDetail(h._id)}>
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `rgba(${meta.color ? '0,212,255' : '0,212,255'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                        {meta.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{formatDate(h.createdAt)}</div>
                                    </div>
                                    <span className={`badge ${meta.badge || 'badge-gray'}`} style={{ flexShrink: 0 }}>{meta.label}</span>
                                    <button className="btn btn-sm btn-danger" style={{ flexShrink: 0, padding: '0.3rem 0.5rem' }}
                                        onClick={e => { e.stopPropagation(); handleDelete(h._id) }}><Trash2 size={16} /></button>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', width: '20px', textAlign: 'center' }}>
                                        {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                </div>

                                {/* Expanded Detail */}
                                {isSelected && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'rgba(0,0,0,0.2)' }}>
                                        {detailLoading ? (
                                            <div style={{ textAlign: 'center', padding: '1rem' }}><div className="loading-dots" style={{ justifyContent: 'center' }}><span /><span /><span /></div></div>
                                        ) : detail ? (
                                            <div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                                    <span className="badge badge-gray">Model: {detail.model || 'AI'}</span>
                                                    <span className="badge badge-gray">Tokens: {detail.tokensUsed || '—'}</span>
                                                    <span className="badge badge-gray">{formatDate(detail.createdAt)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>INPUT</div>
                                                <div style={{ marginBottom: '1.5rem', maxHeight: 300, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                                    <StructuredViewer data={detail.input} />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>OUTPUT PREVIEW</div>
                                                <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                                    <StructuredViewer data={detail.output} />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            {total > history.length && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Showing {history.length} of {total} queries
                </div>
            )}
        </div>
    )
}
