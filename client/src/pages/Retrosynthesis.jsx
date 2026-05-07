import { useState } from 'react'
import toast from 'react-hot-toast'
import MoleculeInput from '../components/MoleculeInput'
import { api } from '../context/AuthContext'
import { Network, Target, FlaskConical, Store, Package, FolderTree, ArrowRight, TrendingUp, Lightbulb, Route } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function Retrosynthesis() {
    const [molecule, setMolecule] = useState('')
    const [smiles, setSmiles] = useState('')
    const [inputType, setInputType] = useState('name')
    const [complexity, setComplexity] = useState('standard')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [open, setOpen] = useState({ forward: true, starts: true, alts: false, tree: false })
    const toggle = k => setOpen(p => ({ ...p, [k]: !p[k] }))

    const handleMoleculeChange = (val, type) => {
        setInputType(type); if (type === 'smiles') setSmiles(val); else setMolecule(val)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true); setResult(null)
        try {
            const res = await api.post('/retrosynthesis', { molecule, smiles, inputType, complexity })
            setResult(res.data.data)
            toast.success('Retrosynthesis complete!')
        } catch (err) { toast.error(err.response?.data?.error || 'Analysis failed') }
        finally { setLoading(false) }
    }

    const d = result || {}

    const analyzeTree = (node, depth = 0) => {
        if (!node) return { nodes: 0, leaves: 0, maxDepth: depth }
        const children = Array.isArray(node.children) ? node.children : []
        const childStats = children.map(child => analyzeTree(child, depth + 1))
        const nodes = 1 + childStats.reduce((sum, stat) => sum + stat.nodes, 0)
        const leaves = children.length === 0 ? 1 : childStats.reduce((sum, stat) => sum + stat.leaves, 0)
        const maxDepth = childStats.length > 0 ? Math.max(depth, ...childStats.map(stat => stat.maxDepth)) : depth
        return { nodes, leaves, maxDepth }
    }

    const getNodeTone = (node, depth) => {
        if (depth === 0) return {
            accent: 'var(--cyan)',
            accentSoft: 'var(--cyan-dim)',
            border: 'var(--cyan-border)',
            glow: 'var(--shadow-glow)',
            label: 'Target'
        }
        if (node?.isCommercial) return {
            accent: 'var(--green)',
            accentSoft: 'var(--green-dim)',
            border: 'var(--green-border)',
            glow: 'var(--shadow-card)',
            label: 'Buyable'
        }
        return {
            accent: 'var(--purple)',
            accentSoft: 'var(--purple-dim)',
            border: 'var(--purple-border)',
            glow: 'var(--shadow-card)',
            label: 'Intermediate'
        }
    }

    const renderTreeNode = (node, depth = 0, isRoot = false) => {
        if (!node) return null
        const tone = getNodeTone(node, depth)
        const children = Array.isArray(node.children) ? node.children : []
        const isLeaf = children.length === 0
        return (
            <div key={`${node.molecule}-${depth}`} className="retro-tree-node" style={{ '--node-border': tone.border, '--node-soft': tone.accentSoft, '--node-shadow': tone.glow }}>
                {!isRoot && (
                    <div className="retro-tree-node__link" />
                )}
                <div className="retro-tree-node__card" style={{ maxWidth: depth === 0 ? '100%' : 360 }}>
                    <div className="retro-tree-node__body">
                        <div className="retro-tree-node__icon">
                            {node.isCommercial ? <Store size={18} color={tone.accent} /> : depth === 0 ? <Target size={18} color={tone.accent} /> : <FlaskConical size={18} color={tone.accent} />}
                        </div>

                        <div className="retro-tree-node__content">
                            <div className="retro-tree-node__titleRow">
                                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>{node.molecule}</div>
                                <span className="badge" style={{ background: tone.accentSoft, color: tone.accent, border: `1px solid ${tone.border}` }}>{tone.label}</span>
                                {node.transform && <span className="badge badge-purple">{node.transform}</span>}
                                {isLeaf && <span className="badge badge-green">Leaf</span>}
                            </div>

                            {node.smiles && (
                                <div className="retro-tree-node__smiles">
                                    {node.smiles}
                                </div>
                            )}

                            {(node.disconnection || node.synthon || node.branchLabel || node.confidence) && (
                                <div className="retro-tree-node__meta">
                                    {node.disconnection && <span className="badge badge-cyan">Disconnection: {node.disconnection}</span>}
                                    {node.synthon && <span className="badge badge-purple">Synthon: {node.synthon}</span>}
                                    {node.confidence && <span className={`badge ${node.confidence === 'high' ? 'badge-green' : node.confidence === 'medium' ? 'badge-cyan' : 'badge-amber'}`}>Confidence: {node.confidence}</span>}
                                </div>
                            )}

                            {node.branchLabel && (
                                <div className="retro-tree-node__label">
                                    {node.branchLabel}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                                {node.isCommercial && node.commercialSource && (
                                    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Package size={12} /> {node.commercialSource}
                                    </span>
                                )}
                                {node.estimatedCost && <span className="badge badge-amber">Cost: {node.estimatedCost}</span>}
                                {node.reactionType && <span className="badge badge-cyan">{node.reactionType}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {children.length > 0 && (
                    <div className="retro-tree-children">
                        <div className="retro-tree-childrenGrid">
                            {children.map((child, index) => (
                                <div key={`${child.molecule || 'child'}-${index}`} className="retro-tree-child" style={{ '--node-border': tone.border, '--node-soft': tone.accentSoft, '--node-shadow': tone.glow }}>
                                    {renderTreeNode(child, depth + 1)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'var(--green-dim)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <Network size={32} color="var(--green)" />
                    </div>
                    <div><span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>USE CASE 4</span><h1>Retrosynthesis Planning</h1></div>
                </div>
                <p>Deconstruct complex target molecules into simpler, commercially available starting materials</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}><Target size={18} /><span style={{ fontWeight: 700 }}>Target Molecule</span></div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <MoleculeInput value={molecule} smilesValue={smiles} onChange={handleMoleculeChange} onSmilesChange={setSmiles} label="Target Molecule" />
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Analysis Complexity</label>
                                <select className="form-select" value={complexity} onChange={e => setComplexity(e.target.value)}>
                                    <option value="standard">Standard (3-5 steps)</option>
                                    <option value="advanced">Advanced (full retrosynthetic tree)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
                                {loading ? <><div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing...</> : <><Network size={18} /> Plan Retrosynthesis</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div className="analyzing-icon"><Network size={48} color="var(--green)" /></div>
                            <div className="analyzing-text gradient-text">Planning Retrosynthesis</div>
                            <div className="loading-dots"><span /><span /><span /></div>
                            <div className="analyzing-subtext">Deconstructing molecule into building blocks...</div>
                        </div></div>
                    )}

                    {result && !loading && (
                        <div>
                            {/* Summary */}
                            <div className="glass-card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                    <h2 style={{ marginBottom: '0.75rem' }}>{d.targetMolecule || molecule}</h2>
                                    <div className="grid-4" style={{ marginBottom: '1rem' }}>
                                        <div className="metric-card"><div className="metric-label">Steps</div><div className="metric-value gradient-text">{d.numberOfSteps || '—'}</div></div>
                                        <div className="metric-card"><div className="metric-label">Complexity</div><div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--purple)' }}>{d.syntheticComplexity || '—'}/10</div></div>
                                        <div className="metric-card"><div className="metric-label">Overall Yield</div><div className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--green)' }}>{d.overallYield || '—'}</div></div>
                                        <div className="metric-card"><div className="metric-label">Starting Materials</div><div className="metric-value gradient-text">{d.startingMaterials?.length || '—'}</div></div>
                                    </div>
                                    {d.keyTransformations?.length > 0 && (
                                        <div><div className="form-label">Key Transformations</div><div className="tags-list mt-1">{d.keyTransformations.map((t, i) => <span key={i} className="badge badge-purple">{t}</span>)}</div></div>
                                    )}
                                </div>
                            </div>

                            {/* Retrosynthesis Tree */}
                            {d.retrosynthesisTree && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('tree')}>
                                        <FolderTree size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Retrosynthetic Tree</span>
                                        <span className="badge badge-cyan">{analyzeTree(d.retrosynthesisTree).nodes} nodes</span>
                                        <span>{open.tree ? '▲' : '▼'}</span>
                                    </div>
                                    {open.tree && (
                                        <div className="result-section-body">
                                            <div className="retro-tree-summary" style={{ marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    <div className="metric-card" style={{ minWidth: 120 }}>
                                                        <div className="metric-label">Tree Nodes</div>
                                                        <div className="metric-value gradient-text">{analyzeTree(d.retrosynthesisTree).nodes}</div>
                                                    </div>
                                                    <div className="metric-card" style={{ minWidth: 120 }}>
                                                        <div className="metric-label">Leaves</div>
                                                        <div className="metric-value" style={{ color: 'var(--green)' }}>{analyzeTree(d.retrosynthesisTree).leaves}</div>
                                                    </div>
                                                    <div className="metric-card" style={{ minWidth: 120 }}>
                                                        <div className="metric-label">Depth</div>
                                                        <div className="metric-value" style={{ color: 'var(--purple)' }}>{analyzeTree(d.retrosynthesisTree).maxDepth + 1}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="retro-tree-canvas">
                                                <div className="retro-tree-track">
                                                    {renderTreeNode(d.retrosynthesisTree, 0, true)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Forward Synthesis */}
                            {d.forwardSynthesis?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('forward')}>
                                        <ArrowRight size={18} color="var(--purple)" />
                                        <span className="result-section-title">Forward Synthesis (Step by Step)</span>
                                        <span className="badge badge-cyan">{d.forwardSynthesis.length} steps</span>
                                        <span>{open.forward ? '▲' : '▼'}</span>
                                    </div>
                                    {open.forward && (
                                        <div className="result-section-body">
                                            <div className="step-list">
                                                {d.forwardSynthesis.map((step, i) => (
                                                    <div key={i} className="step-item">
                                                        <div className="step-number">{step.step || i + 1}</div>
                                                        <div className="step-content">
                                                            <div className="step-title">{step.from} → {step.to}</div>
                                                            {step.reaction && <span className="badge badge-purple" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><FlaskConical size={12} /> {step.reaction}</span>}
                                                            <div className="step-desc">{step.conditions}</div>
                                                            {step.reagents?.length > 0 && (
                                                                <div className="tags-list" style={{ marginTop: '0.5rem' }}>
                                                                    {step.reagents.map((r, j) => <span key={j} className="tag">{r}</span>)}
                                                                </div>
                                                            )}
                                                            <div className="step-meta">
                                                                {step.yield && <span className="badge badge-green"><TrendingUp size={14} /> {step.yield}</span>}
                                                            </div>
                                                            {step.notes && <div className="markdown-body" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}><Lightbulb size={14} style={{ marginTop: 2, flexShrink: 0 }} /> <div><ReactMarkdown>{step.notes}</ReactMarkdown></div></div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Starting Materials */}
                            {d.startingMaterials?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('starts')}>
                                        <Store size={18} color="var(--green)" />
                                        <span className="result-section-title">Commercial Starting Materials</span>
                                        <span className="badge badge-green">{d.startingMaterials.length}</span>
                                        <span>{open.starts ? '▲' : '▼'}</span>
                                    </div>
                                    {open.starts && (
                                        <div className="result-section-body" style={{ padding: 0, overflowX: 'auto' }}>
                                            <table className="chem-table">
                                                <thead><tr><th>Material</th><th>CAS</th><th>Role</th><th>Supplier</th><th>Cost</th><th>Availability</th></tr></thead>
                                                <tbody>
                                                    {d.startingMaterials.map((m, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                                                            <td><span className="font-mono text-xs">{m.casNumber || '—'}</span></td>
                                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{m.role}</td>
                                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.commercialSource || '—'}</td>
                                                            <td className="font-mono text-amber">{m.estimatedCost || '—'}</td>
                                                            <td><span className={`badge ${m.availability === 'readily available' ? 'badge-green' : 'badge-amber'}`}>{m.availability}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Alternative Routes */}
                            {d.alternativeRoutes?.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-header" onClick={() => toggle('alts')}>
                                        <Route size={18} color="var(--amber)" />
                                        <span className="result-section-title">Alternative Routes</span>
                                        <span>{open.alts ? '▲' : '▼'}</span>
                                    </div>
                                    {open.alts && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {d.alternativeRoutes.map((r, i) => (
                                                    <div key={i} style={{ padding: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                                        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{r.route}</div>
                                                        <div className="markdown-body" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}><ReactMarkdown>{r.description}</ReactMarkdown></div>
                                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                            <div><div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, marginBottom: '0.3rem' }}>✓ PROS</div>{r.advantages?.map((a, j) => <div key={j} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {a}</div>)}</div>
                                                            <div><div style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, marginBottom: '0.3rem' }}>✗ CONS</div>{r.disadvantages?.map((a, j) => <div key={j} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {a}</div>)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div style={{ background: 'var(--green-dim)', padding: '1rem', borderRadius: '50%' }}>
                                <Network size={48} color="var(--green)" />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Enter a target molecule</div>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                AI will deconstruct your molecule into commercially available building blocks with step-by-step synthesis.
                            </p>
                        </div></div>
                    )}
                </div>
            </div>
        </div>
    )
}
