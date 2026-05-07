import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../context/AuthContext'
import { Microscope, Search, TrendingUp, DollarSign, AlertTriangle, RefreshCw, Settings2, ClipboardList, Leaf } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ReactionRenderer from '../components/ReactionRenderer'

export default function Optimize() {
    const [form, setForm] = useState({ molecule: '', reaction: '', currentChemicals: '', temperature: '', pressure: '', targetYield: '' })
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [open, setOpen] = useState({ alts: true, cond: true, improvements: true, byProducts: false, risks: false })
    const toggle = k => setOpen(p => ({ ...p, [k]: !p[k] }))
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.molecule && !form.reaction) return toast.error('Enter a molecule or reaction')
        setLoading(true); setResult(null)
        try {
            const chemicals = form.currentChemicals.split(',').map(s => s.trim()).filter(Boolean)
            const conditions = {
                temperature: form.temperature,
                pressure: form.pressure,
            }
            const res = await api.post('/optimize', { molecule: form.molecule, reaction: form.reaction, currentChemicals: chemicals, currentConditions: conditions, targetYield: form.targetYield })
            setResult(res.data.data)
            toast.success('Optimization complete!')
        } catch (err) { toast.error(err.response?.data?.error || 'Optimization failed') }
        finally { setLoading(false) }
    }

    const d = result || {}

    const getRiskColor = (improvement) => {
        if (!improvement) return 'var(--text-secondary)'
        const num = parseFloat(improvement)
        if (num > 10) return 'var(--green)'; if (num > 0) return 'var(--cyan)'; return 'var(--amber)'
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'var(--purple-dim)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <Microscope size={32} color="var(--purple)" />
                    </div>
                    <div><span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>USE CASE 2</span><h1>Reaction Optimizer</h1></div>
                </div>
                <p>Suggest alternative chemicals and optimized reaction parameters (temperature, pressure, flow) for better yield</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}>
                        <Search size={18} />
                        <span style={{ fontWeight: 700 }}>Reaction Input</span>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Target Molecule</label>
                                <input className="form-input" placeholder="e.g. Ethyl Acetate" value={form.molecule} onChange={set('molecule')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current Reaction / Process</label>
                                <textarea className="form-input form-textarea" placeholder="Describe your current reaction or paste the equation..." value={form.reaction} onChange={set('reaction')} required style={{ minHeight: '100px' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current Chemicals (comma separated)</label>
                                <input className="form-input" placeholder="e.g. Acetic Acid, Ethanol, H2SO4 catalyst" value={form.currentChemicals} onChange={set('currentChemicals')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current Temperature</label>
                                <input className="form-input" placeholder="e.g. 80°C" value={form.temperature} onChange={set('temperature')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current Pressure</label>
                                <input className="form-input" placeholder="e.g. 1 atm" value={form.pressure} onChange={set('pressure')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Yield % (optional)</label>
                                <input type="number" className="form-input" placeholder="e.g. 90" min="1" max="100" value={form.targetYield} onChange={set('targetYield')} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? <><div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} /> Optimizing...</> : <><Microscope size={18} /> Optimize Reaction</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div className="analyzing-icon"><Microscope size={48} color="var(--purple)" /></div>
                            <div className="analyzing-text gradient-text">Optimizing Reaction</div>
                            <div className="loading-dots"><span /><span /><span /></div>
                            <div className="analyzing-subtext">Finding alternative chemicals and parameters...</div>
                        </div></div>
                    )}

                    {result && !loading && (
                        <div>
                            <div className="glass-card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ marginBottom: '0.5rem' }}>Optimization Report</h2>
                                            {d.optimized_reaction && <div style={{ marginBottom: '1rem' }}><ReactionRenderer equation={d.optimized_reaction} /></div>}
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                {d.yield_improvement?.expected_yield && <span className="badge badge-green"><TrendingUp size={14} /> Expected Yield: {d.yield_improvement.expected_yield}</span>}
                                                {d.green_chemistry_score?.after && <span className="badge badge-cyan"><Leaf size={14} /> Green Score: {d.green_chemistry_score.after}/10</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {d.yield_improvement?.current_yield && (
                                        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            Current Baseline Yield: <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{d.yield_improvement.current_yield}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Alternative Chemicals */}
                            {d.alternative_chemicals?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('alts')}>
                                        <RefreshCw size={18} color="var(--purple)" />
                                        <span className="result-section-title">Alternative Chemicals</span>
                                        <span className="badge badge-purple">{d.alternative_chemicals.length}</span>
                                        <span>{open.alts ? '▲' : '▼'}</span>
                                    </div>
                                    {open.alts && (
                                        <div className="result-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {d.alternative_chemicals.map((alt, i) => (
                                                <div key={i} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>{alt.name}</div>
                                                    <div className="markdown-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}><ReactMarkdown>{alt.reason}</ReactMarkdown></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Optimized Conditions */}
                            {d.optimized_conditions && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('cond')}>
                                        <Settings2 size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Optimized Reaction Parameters</span>
                                        <span>{open.cond ? '▲' : '▼'}</span>
                                    </div>
                                    {open.cond && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {Object.entries(d.optimized_conditions).map(([k, v]) => v && (
                                                    <div key={k} className="property-item" style={{ background: 'var(--bg-input)' }}>
                                                        <div className="property-label" style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                                                        <div className="property-value" style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}><ReactMarkdown>{v}</ReactMarkdown></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Process Improvements */}
                            {d.process_improvements?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('improvements')}>
                                        <ClipboardList size={18} color="var(--amber)" />
                                        <span className="result-section-title">Process Improvements</span>
                                        <span>{open.improvements ? '▲' : '▼'}</span>
                                    </div>
                                    {open.improvements && (
                                        <div className="result-section-body">
                                            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                {d.process_improvements.map((step, i) => (
                                                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}><ReactMarkdown>{step}</ReactMarkdown></li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* By-Products & Risks */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {d.by_products?.length > 0 && (
                                    <div className="result-section" style={{ margin: 0 }}>
                                        <div className="result-section-header" onClick={() => toggle('byProducts')}>
                                            <AlertTriangle size={18} color="var(--amber)" />
                                            <span className="result-section-title">By-Products</span>
                                            <span>{open.byProducts ? '▲' : '▼'}</span>
                                        </div>
                                        {open.byProducts && (
                                            <div className="result-section-body">
                                                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                                                    {d.by_products.map((bp, i) => (
                                                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{bp}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {d.risk_reduction?.length > 0 && (
                                    <div className="result-section" style={{ margin: 0 }}>
                                        <div className="result-section-header" onClick={() => toggle('risks')}>
                                            <Leaf size={18} color="var(--green)" />
                                            <span className="result-section-title">Risk Reduction</span>
                                            <span>{open.risks ? '▲' : '▼'}</span>
                                        </div>
                                        {open.risks && (
                                            <div className="result-section-body">
                                                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                                                    {d.risk_reduction.map((risk, i) => (
                                                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{risk}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div style={{ background: 'var(--purple-dim)', padding: '1rem', borderRadius: '50%' }}>
                                <Microscope size={48} color="var(--purple)" />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Enter your reaction to optimize</div>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                Provide your current reaction and chemicals. AI will suggest better alternatives and optimal parameters.
                            </p>
                        </div></div>
                    )}
                </div>
            </div>
        </div>
    )
}
