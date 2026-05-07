import { useState } from 'react'
import toast from 'react-hot-toast'
import MoleculeInput from '../components/MoleculeInput'
import ChemicalPriceInput from '../components/ChemicalPriceInput'
import { api } from '../context/AuthContext'
import { FlaskConical, Search, Leaf, ClipboardList, Thermometer, Wind, Timer, TestTube, TrendingUp, AlertTriangle, Beaker } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const EMPTY = { steps: [], chemicals: [], greenPrinciples: [] }

export default function Manufacturing() {
    const [molecule, setMolecule] = useState('')
    const [smiles, setSmiles] = useState('')
    const [inputType, setInputType] = useState('name')
    const [prices, setPrices] = useState([{ name: '', price: '' }])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [openSections, setOpenSections] = useState({ steps: true, chemicals: true, green: true, safety: false, waste: true, improve: true, scale: true, qc: true, costbreakdown: true, alt: true, reg: true })

    const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

    const handleMoleculeChange = (value, type) => {
        setInputType(type)
        if (type === 'smiles') setSmiles(value)
        else setMolecule(value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!molecule && !smiles) return toast.error('Enter a molecule name or SMILES')

        setLoading(true)
        setResult(null)

        try {
            const chemicalPrices = prices.reduce((acc, item) => {
                const name = item.name?.trim()
                const price = Number.parseFloat(item.price)
                if (name && Number.isFinite(price)) {
                    acc[name] = price
                }
                return acc
            }, {})

            const res = await api.post('/manufacturing', {
                molecule,
                smiles,
                inputType,
                chemicalPrices,
            })

            setResult(res.data.data)
            console.log(res.data.data)
            toast.success('Manufacturing process generated!')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Analysis failed')
        } finally {
            setLoading(false)
        }
    }

    const d = result || EMPTY

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'var(--cyan-dim)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <FlaskConical size={32} color="var(--cyan)" />
                    </div>
                    <div>
                        <span className="badge badge-cyan" style={{ marginBottom: '0.35rem' }}>USE CASE 1</span>
                        <h1>Manufacturing Planner</h1>
                    </div>
                </div>
                <p>AI-generated green chemistry synthesis routes with step-by-step reactions, chemical consumption norms & cost estimation</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}>
                        <Search size={18} />
                        <span style={{ fontWeight: 700 }}>Input</span>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <MoleculeInput
                                value={molecule}
                                smilesValue={smiles}
                                onChange={handleMoleculeChange}
                                onSmilesChange={setSmiles}
                                label="Target Chemical"
                            />

                            <div className="form-group" style={{ marginTop: '1.25rem' }}>
                                <label className="form-label">Chemical Prices (optional)</label>
                                <ChemicalPriceInput value={prices} onChange={setPrices} />
                                <p className="form-hint">Add chemical names and prices for cost estimation.</p>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FlaskConical size={18} /> Generate Process
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card">
                            <div className="analyzing-container">
                                <div className="analyzing-icon"><FlaskConical size={48} color="var(--cyan)" /></div>
                                <div className="analyzing-text gradient-text">Generating Manufacturing Process</div>
                                <div className="loading-dots"><span /><span /><span /></div>
                                <div className="analyzing-subtext">Applying green chemistry principles...</div>
                            </div>
                        </div>
                    )}

                    {result && !loading && (
                        <div>
                            <div className="glass-card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ marginBottom: '0.25rem' }}>{d.targetMolecule || molecule}</h2>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {d.molecularFormula && <span className="chem-formula">{d.molecularFormula}</span>}
                                                {d.casNumber && <span className="badge badge-gray">CAS: {d.casNumber}</span>}
                                            </div>
                                            {d.overview && (
                                                <div className="markdown-body" style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                                    <ReactMarkdown>{d.overview}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green)' }}>{d.greenChemistryScore || '—'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Green Score</div>
                                            <div className="progress-bar" style={{ marginTop: '0.5rem', width: '80px' }}>
                                                <div className="progress-fill" style={{ width: `${d.greenChemistryScore || 0}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {(d.totalMaterialCost > 0 || d.costPerKgProduct > 0) && (
                                        <div className="grid-2" style={{ marginTop: '1.25rem' }}>
                                            <div className="metric-card" style={{ background: 'var(--amber-dim)', borderColor: 'rgba(255,149,0,0.2)' }}>
                                                <div className="metric-label">Total Material Cost</div>
                                                <div className="metric-value gradient-text-amber">${d.totalMaterialCost?.toFixed(2) || '—'}</div>
                                                <div className="metric-sub">per batch</div>
                                            </div>
                                            <div className="metric-card" style={{ background: 'var(--amber-dim)', borderColor: 'rgba(255,149,0,0.2)' }}>
                                                <div className="metric-label">Cost per kg Product</div>
                                                <div className="metric-value gradient-text-amber">${d.costPerKgProduct?.toFixed(2) || '—'}</div>
                                                <div className="metric-sub">estimated</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {d.greenPrinciples?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('green')}>
                                        <Leaf size={18} color="var(--green)" />
                                        <span className="result-section-title">Green Chemistry Principles Applied</span>
                                        <span className="badge badge-green">{d.greenPrinciples.length}</span>
                                        <span>{openSections.green ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.green && (
                                        <div className="result-section-body">
                                            <div className="tags-list">
                                                {d.greenPrinciples.map((principle, index) => (
                                                    <span key={index} className="badge badge-green" style={{ fontSize: '0.8rem' }}>✓ {principle}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {d.steps?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('steps')}>
                                        <ClipboardList size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Manufacturing Steps</span>
                                        <span className="badge badge-cyan">{d.steps.length} steps</span>
                                        <span>{openSections.steps ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.steps && (
                                        <div className="result-section-body">
                                            <div className="step-list">
                                                {d.steps.map((step, index) => (
                                                    <div key={index} className="step-item">
                                                        <div className="step-number">{step.stepNumber || index + 1}</div>
                                                        <div className="step-content">
                                                            <div className="step-title">{step.title}</div>
                                                            {step.description && <div className="step-desc markdown-body"><ReactMarkdown>{step.description}</ReactMarkdown></div>}
                                                            {step.reaction && <div className="reaction-equation" style={{ margin: '0.75rem 0' }}>{step.reaction}</div>}
                                                            <div className="step-meta">
                                                                {step.conditions?.temperature && <span className="badge badge-cyan"><Thermometer size={14} /> {step.conditions.temperature}</span>}
                                                                {step.conditions?.pressure && <span className="badge badge-purple"><Wind size={14} /> {step.conditions.pressure}</span>}
                                                                {step.conditions?.time && <span className="badge badge-gray"><Timer size={14} /> {step.conditions.time}</span>}
                                                                {step.conditions?.solvent && <span className="badge badge-gray"><TestTube size={14} /> {step.conditions.solvent}</span>}
                                                                {step.yield && <span className="badge badge-green"><TrendingUp size={14} /> Yield: {step.yield}</span>}
                                                            </div>
                                                            {step.byproducts?.length > 0 && (
                                                                <div style={{ marginTop: '0.5rem' }}>
                                                                    {step.byproducts.map((byproduct, byproductIndex) => (
                                                                        <span key={byproductIndex} className="badge badge-amber" style={{ marginRight: '0.4rem', marginTop: '0.25rem' }}>
                                                                            <AlertTriangle size={14} /> By-product: {byproduct.name} ({byproduct.amount})
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {d.chemicals?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('chemicals')}>
                                        <Beaker size={18} color="var(--purple)" />
                                        <span className="result-section-title">Chemicals Required & Consumption Norms</span>
                                        <span className="badge badge-purple">{d.chemicals.length} chemicals</span>
                                        <span>{openSections.chemicals ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.chemicals && (
                                        <div className="result-section-body" style={{ padding: 0, overflowX: 'auto' }}>
                                            <table className="chem-table">
                                                <thead>
                                                    <tr>
                                                        <th>Chemical</th>
                                                        <th>CAS</th>
                                                        <th>Role</th>
                                                        <th>Quantity</th>
                                                        <th>Norm (kg/kg)</th>
                                                        <th>$/kg</th>
                                                        <th>Subtotal</th>
                                                        <th>Green</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {d.chemicals.map((chemical, index) => (
                                                        <tr key={index}>
                                                            <td style={{ fontWeight: 600 }}>{chemical.name}</td>
                                                            <td><span className="font-mono text-xs text-secondary">{chemical.casNumber || '—'}</span></td>
                                                            <td><span className="badge badge-gray">{chemical.role}</span></td>
                                                            <td className="font-mono">{chemical.quantity} {chemical.unit}</td>
                                                            <td className="font-mono text-cyan">{chemical.consumptionNorm || '—'}</td>
                                                            <td className="font-mono">{chemical.estimatedPricePerKg ? `$${chemical.estimatedPricePerKg}` : '—'}</td>
                                                            <td className="font-mono text-amber">
                                                                {chemical.estimatedPricePerKg && chemical.quantity
                                                                    ? `$${(Number.parseFloat(chemical.quantity) * chemical.estimatedPricePerKg).toFixed(2)}`
                                                                    : '—'}
                                                            </td>
                                                            <td>{chemical.isGreen ? <span className="badge badge-green">✓</span> : <span className="badge badge-gray">—</span>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {d.safetyConsiderations?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('safety')}>
                                        <AlertTriangle size={18} color="var(--red)" />
                                        <span className="result-section-title">Safety Considerations</span>
                                        <span>{openSections.safety ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.safety && (
                                        <div className="result-section-body">
                                            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                {d.safetyConsiderations.map((item, index) => (
                                                    <li key={index} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}><ReactMarkdown>{item}</ReactMarkdown></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Waste Stream & Environmental Impact */}
                            {d.wasteGenerated?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('waste')}>
                                        <Wind size={18} color="var(--amber)" />
                                        <span className="result-section-title">Waste Streams & Environmental Impact</span>
                                        <span>{openSections.waste ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.waste && (
                                        <div className="result-section-body">
                                            <div className="tags-list">
                                                {d.wasteGenerated.map((waste, index) => (
                                                    <span key={index} className="badge badge-amber">⚠️ {waste}</span>
                                                ))}
                                            </div>
                                            {d.wasteMinimizationStrategy && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem' }}>♻️ Minimization Strategy</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{d.wasteMinimizationStrategy}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Process Improvements */}
                            {d.improvements?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('improve')}>
                                        <TrendingUp size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Process Optimization Tips</span>
                                        <span className="badge badge-cyan">{d.improvements.length}</span>
                                        <span>{openSections.improve ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.improve && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {d.improvements.map((improvement, index) => (
                                                    <div key={index} style={{ padding: '0.75rem', background: 'var(--cyan-dim)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--cyan)' }}>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>💡 {improvement}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scalability & Production Scale */}
                            {d.scalabilityNotes || d.scalabilityRating && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('scale')}>
                                        <FlaskConical size={18} color="var(--purple)" />
                                        <span className="result-section-title">Scalability & Production Assessment</span>
                                        <span>{openSections.scale ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.scale && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.scalabilityRating && (
                                                    <div className="property-item">
                                                        <div className="property-label">Production Rating</div>
                                                        <span className={`badge ${d.scalabilityRating.includes('excellent') ? 'badge-green' : d.scalabilityRating.includes('good') ? 'badge-cyan' : 'badge-amber'}`}>
                                                            {d.scalabilityRating}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {d.scalabilityNotes && (
                                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--purple-dim)', borderRadius: 'var(--radius-sm)' }}>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{d.scalabilityNotes}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quality Control Checkpoints */}
                            {d.qualityControlCheckpoints?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('qc')}>
                                        <TestTube size={18} color="var(--green)" />
                                        <span className="result-section-title">Quality Control Checkpoints</span>
                                        <span>{openSections.qc ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.qc && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {d.qualityControlCheckpoints.map((checkpoint, index) => (
                                                    <div key={index} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,230,118,0.1)', borderLeft: '3px solid var(--green)', borderRadius: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.9rem' }}>✓ {checkpoint}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cost Breakdown Analysis */}
                            {(d.totalMaterialCost > 0 || d.costPerKgProduct > 0) && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('costbreakdown')}>
                                        <TrendingUp size={18} color="var(--amber)" />
                                        <span className="result-section-title">Cost Analysis Breakdown</span>
                                        <span>{openSections.costbreakdown ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.costbreakdown && (
                                        <div className="result-section-body">
                                            <div className="grid-2" style={{ marginBottom: '1rem' }}>
                                                {d.totalMaterialCost > 0 && (
                                                    <div className="metric-card" style={{ background: 'var(--amber-dim)' }}>
                                                        <div className="metric-label">Total Material Cost</div>
                                                        <div className="metric-value gradient-text-amber">${d.totalMaterialCost?.toFixed(2)}</div>
                                                        <div className="metric-sub">per batch</div>
                                                    </div>
                                                )}
                                                {d.costPerKgProduct > 0 && (
                                                    <div className="metric-card" style={{ background: 'var(--amber-dim)' }}>
                                                        <div className="metric-label">Cost per kg</div>
                                                        <div className="metric-value gradient-text-amber">${d.costPerKgProduct?.toFixed(2)}</div>
                                                        <div className="metric-sub">product cost</div>
                                                    </div>
                                                )}
                                            </div>
                                            {d.chemicals?.length > 0 && (
                                                <div style={{ padding: '0.75rem', background: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Top Cost Contributors</div>
                                                    {d.chemicals.slice(0, 3).map((chem, i) => {
                                                        const subtotal = chem.estimatedPricePerKg && chem.quantity ? (Number.parseFloat(chem.quantity) * chem.estimatedPricePerKg).toFixed(2) : 0;
                                                        return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                                            <span>{chem.name}</span>
                                                            <span className="font-mono">${subtotal}</span>
                                                        </div>;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Alternative Routes */}
                            {d.alternativeRoutes?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('alt')}>
                                        <Leaf size={18} color="var(--green)" />
                                        <span className="result-section-title">Alternative Green Routes</span>
                                        <span className="badge badge-green">{d.alternativeRoutes.length}</span>
                                        <span>{openSections.alt ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.alt && (
                                        <div className="result-section-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {d.alternativeRoutes.map((route, index) => (
                                                    <div key={index} style={{ padding: '0.75rem', background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
                                                        <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.35rem' }}>Route {index + 1}: {route.name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{route.description}</div>
                                                        {route.yield && <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>Expected Yield: {route.yield}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Regulatory Compliance */}
                            {d.regulatoryCompliance && (
                                <div className="result-section">
                                    <div className="result-section-header" onClick={() => toggle('reg')}>
                                        <AlertTriangle size={18} color="var(--purple)" />
                                        <span className="result-section-title">Regulatory Compliance Notes</span>
                                        <span>{openSections.reg ? '▲' : '▼'}</span>
                                    </div>
                                    {openSections.reg && (
                                        <div className="result-section-body">
                                            <div style={{ padding: '0.75rem', background: 'var(--purple-dim)', borderRadius: 'var(--radius-sm)' }}>
                                                <ReactMarkdown>{d.regulatoryCompliance}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card">
                            <div className="analyzing-container">
                                <div style={{ background: 'var(--cyan-dim)', padding: '1rem', borderRadius: '50%' }}>
                                    <FlaskConical size={48} color="var(--cyan)" />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Enter a chemical to get started</div>
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    ChemistAI will generate a complete green chemistry manufacturing process with reactions, chemicals, and consumption norms.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}