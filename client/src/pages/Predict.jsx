import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../context/AuthContext'
import { Target, Search, Leaf, Scale, Sparkles, CheckCircle, Microscope, AlertTriangle, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ReactionRenderer from '../components/ReactionRenderer'

export default function Predict() {
    const [form, setForm] = useState({ reactants: '', reagents: '', temperature: '', time: '', molecule: '' })
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [open, setOpen] = useState({ main: true, side: true, cond: false })
    const toggle = k => setOpen(p => ({ ...p, [k]: !p[k] }))
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.reactants) return toast.error('Enter reactants')
        setLoading(true); setResult(null)
        try {
            const reagents = form.reagents.split(',').map(s => s.trim()).filter(Boolean)
            const conditions = {
                temperature: form.temperature,
                time: form.time,
            }
            const res = await api.post('/predict', { reactants: form.reactants, reagents, conditions, molecule: form.molecule })
            setResult(res.data.data)
            toast.success('Reaction outcome predicted!')
        } catch (err) { toast.error(err.response?.data?.error || 'Prediction failed') }
        finally { setLoading(false) }
    }

    const d = result || {}
    const yieldVal = d.mainProduct?.predictedYield
    const yieldColor = yieldVal > 75 ? 'var(--green)' : yieldVal > 50 ? 'var(--cyan)' : yieldVal > 25 ? 'var(--amber)' : 'var(--red)'

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'rgba(255,107,157,0.15)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <Target size={32} color="#FF6B9D" />
                    </div>
                    <div><span className="badge" style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.3)', marginBottom: '0.35rem' }}>USE CASE 5</span><h1>Reaction Outcome Prediction</h1></div>
                </div>
                <p>Predict yield, main products, and side-products of a reaction to reduce waste and cost</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}><Search size={18} /><span style={{ fontWeight: 700 }}>Reaction Input</span></div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Reactants *</label>
                                <textarea className="form-input form-textarea" placeholder="A + B → ? &#10;e.g. Ethanol + Acetic Acid" value={form.reactants} onChange={set('reactants')} required style={{ minHeight: '80px' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reagents / Catalysts</label>
                                <input className="form-input" placeholder="e.g. H2SO4, NaBH4, Pd/C (comma separated)" value={form.reagents} onChange={set('reagents')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temperature</label>
                                <input className="form-input" placeholder="e.g. 80°C" value={form.temperature} onChange={set('temperature')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time</label>
                                <input className="form-input" placeholder="e.g. 2h" value={form.time} onChange={set('time')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Product (optional)</label>
                                <input className="form-input" placeholder="Expected product name" value={form.molecule} onChange={set('molecule')} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? <><div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} /> Predicting...</> : <><Target size={18} /> Predict Outcome</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div className="analyzing-icon"><Target size={48} color="#FF6B9D" /></div>
                            <div className="analyzing-text gradient-text">Predicting Reaction Outcome</div>
                            <div className="loading-dots"><span /><span /><span /></div>
                            <div className="analyzing-subtext">Analyzing mechanism, stereochemistry, by-products...</div>
                        </div></div>
                    )}

                    {result && !loading && (
                        <div>
                            {/* Summary */}
                            <div className="glass-card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ marginBottom: '0.5rem' }}>{d.reactionType || 'Reaction'}</h2>
                                            {d.reactionSummary && <div className="markdown-body" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}><ReactMarkdown>{d.reactionSummary}</ReactMarkdown></div>}
                                            {d.reactionEquation && <div style={{ marginBottom: '1rem' }}><ReactionRenderer equation={d.reactionEquation} /></div>}
                                        </div>
                                        <div style={{ textAlign: 'center', minWidth: 100 }}>
                                            <div style={{ fontSize: '3rem', fontWeight: 900, color: yieldColor }}>{yieldVal || '—'}%</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted Yield</div>
                                            {d.mainProduct?.yieldRange && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Range: {d.mainProduct.yieldRange}</div>}
                                            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                                                <div className="progress-fill" style={{ width: `${yieldVal || 0}%`, background: `linear-gradient(90deg, ${yieldColor}, var(--cyan))` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                        {d.greenChemistryScore && <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Leaf size={12} /> Green Score: {d.greenChemistryScore}</span>}
                                        {d.scalabilityRating && <span className={`badge ${d.scalabilityRating === 'excellent' ? 'badge-green' : d.scalabilityRating === 'good' ? 'badge-cyan' : 'badge-amber'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Scale size={12} /> Scale: {d.scalabilityRating}</span>}
                                        {d.purityExpected && <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Sparkles size={12} /> Purity: {d.purityExpected}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Main Product */}
                            {d.mainProduct && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('main')}>
                                        <CheckCircle size={18} color="var(--green)" />
                                        <span className="result-section-title">Main Product</span>
                                        <span className="badge badge-green">{d.mainProduct.predictedYield}%</span>
                                        <span>{open.main ? '▲' : '▼'}</span>
                                    </div>
                                    {open.main && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{d.mainProduct.name}</div>
                                                    {d.mainProduct.smiles && <div className="reaction-equation" style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>{d.mainProduct.smiles}</div>}
                                                    {d.mainProduct.yieldFactors?.length > 0 && (
                                                        <div><div className="form-label">Yield Factors</div><ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>{d.mainProduct.yieldFactors.map((f, i) => <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{f}</li>)}</ul></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="metric-card" style={{ minWidth: 140 }}>
                                                        <div className="metric-label">Confidence</div>
                                                        <div className="metric-value" style={{ fontSize: '1.1rem', color: d.mainProduct.yieldConfidence === 'high' ? 'var(--green)' : 'var(--amber)' }}>{d.mainProduct.yieldConfidence}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {d.stereochemistry && (
                                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--purple-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(123,47,255,0.2)' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--purple)', marginBottom: '0.35rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Microscope size={14} /> Stereochemistry</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Control: {d.stereochemistry.stereocontrol} · {d.stereochemistry.expectedStereochemistry}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Side Products */}
                            {d.sideProducts?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('side')}>
                                        <AlertTriangle size={18} color="var(--amber)" />
                                        <span className="result-section-title">Side Products</span>
                                        <span className="badge badge-amber">{d.sideProducts.length}</span>
                                        <span>{open.side ? '▲' : '▼'}</span>
                                    </div>
                                    {open.side && (
                                        <div className="result-section-body" style={{ padding: 0, overflowX: 'auto' }}>
                                            <table className="chem-table">
                                                <thead><tr><th>Side Product</th><th>Amount</th><th>Yield %</th><th>Formation</th><th>Separability</th></tr></thead>
                                                <tbody>
                                                    {d.sideProducts.map((sp, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600 }}>{sp.name}</td>
                                                            <td><span className={`badge ${sp.estimatedAmount?.includes('trace') ? 'badge-green' : sp.estimatedAmount?.includes('major') ? 'badge-red' : 'badge-amber'}`}>{sp.estimatedAmount}</span></td>
                                                            <td className="font-mono">{sp.percentYield ? `${sp.percentYield}%` : '—'}</td>
                                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 200 }}>{sp.formationMechanism}</td>
                                                            <td><span className={`badge ${sp.separability === 'easy' ? 'badge-green' : sp.separability === 'difficult' ? 'badge-red' : 'badge-amber'}`}>{sp.separability}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Improvements */}
                            {d.improvements?.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header" onClick={() => toggle('cond')}>
                                        <Lightbulb size={18} color="var(--amber)" />
                                        <span className="result-section-title">Improvements & Workup</span>
                                        <span>{open.cond ? '▲' : '▼'}</span>
                                    </div>
                                    {open.cond && (
                                        <div className="result-section-body">
                                            <div className="grid-2">
                                                <div><div className="form-label" style={{ marginBottom: '0.5rem' }}>How to Improve</div><ul style={{ paddingLeft: '1.25rem' }}>{d.improvements.map((imp, i) => <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{imp}</li>)}</ul></div>
                                                <div>
                                                    {d.workupProcedure && <div style={{ marginBottom: '0.75rem' }}><div className="form-label">Workup</div><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{d.workupProcedure}</div></div>}
                                                    {d.purificationMethod && <div><div className="form-label">Purification</div><div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{d.purificationMethod}</div></div>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div style={{ background: 'rgba(255,107,157,0.15)', padding: '1rem', borderRadius: '50%' }}>
                                <Target size={48} color="#FF6B9D" />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Enter a reaction to predict its outcome</div>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                AI will predict yield, products, side-products, and stereochemistry based on reaction mechanisms.
                            </p>
                        </div></div>
                    )}
                </div>
            </div>
        </div>
    )
}
