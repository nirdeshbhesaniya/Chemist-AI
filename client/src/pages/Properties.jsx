import { useState } from 'react'
import toast from 'react-hot-toast'
import MoleculeInput from '../components/MoleculeInput'
import { api } from '../context/AuthContext'
import { LineChart, Search, Thermometer, Droplet, Skull, Pill, AlertTriangle } from 'lucide-react'

const confColor = c => c === 'high' ? 'var(--green)' : c === 'medium' ? 'var(--amber)' : 'var(--red)'
const formatViolations = (violations) => {
    if (!violations) return []
    if (Array.isArray(violations)) {
        return violations.flatMap(item => {
            if (typeof item === 'string') return [item]
            if (item && typeof item === 'object') {
                return [item.label, item.name, item.value, item.message].filter(Boolean).map(String)
            }
            return [String(item)]
        })
    }
    if (typeof violations === 'string') {
        return violations.split(/[,;\n]/).map(item => item.trim()).filter(Boolean)
    }
    if (typeof violations === 'object') {
        return Object.values(violations).flatMap(value => formatViolations(value))
    }
    return [String(violations)]
}

export default function Properties() {
    const [molecule, setMolecule] = useState('')
    const [smiles, setSmiles] = useState('')
    const [inputType, setInputType] = useState('name')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [open, setOpen] = useState({ phys: true, sol: true, tox: true, adme: false, reg: true, stab: true, ind: true, adv: false })
    const toggle = k => setOpen(p => ({ ...p, [k]: !p[k] }))

    const handleMoleculeChange = (val, type) => {
        setInputType(type); if (type === 'smiles') setSmiles(val); else setMolecule(val)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true); setResult(null)
        try {
            const res = await api.post('/properties', { molecule, smiles, inputType })
            setResult(res.data.data)
            toast.success('Properties predicted!')
        } catch (err) { toast.error(err.response?.data?.error || 'Prediction failed') }
        finally { setLoading(false) }
    }

    const d = result || {}
    const pv = d.pubchemVerified

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'var(--amber-dim)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <LineChart size={32} color="var(--amber)" />
                    </div>
                    <div><span className="badge badge-amber" style={{ marginBottom: '0.35rem' }}>USE CASE 3</span><h1>Property Prediction</h1></div>
                </div>
                <p>Predict boiling point, toxicity, solubility, conductivity, and ADME profile using AI + PubChem data</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ position: 'sticky', top: '1rem' }}>
                    <div className="card-header" style={{ gap: '0.5rem' }}>
                        <Search size={18} />
                        <span style={{ fontWeight: 700 }}>Molecule Input</span>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <MoleculeInput value={molecule} smilesValue={smiles} onChange={handleMoleculeChange} onSmilesChange={setSmiles} label="Molecule" />
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '1rem' }}>
                                {loading ? <><div className="loading-orb" style={{ width: 18, height: 18, borderWidth: 2 }} /> Predicting...</> : <><LineChart size={18} /> Predict Properties</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    {loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div className="analyzing-icon"><LineChart size={48} color="var(--amber)" /></div>
                            <div className="analyzing-text gradient-text">Predicting Molecular Properties</div>
                            <div className="loading-dots"><span /><span /><span /></div>
                            <div className="analyzing-subtext">Querying PubChem + AI QSAR models...</div>
                        </div></div>
                    )}

                    {result && !loading && (
                        <div>
                            {/* Header */}
                            <div className="glass-card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ marginBottom: '0.5rem' }}>{d.molecule || molecule}</h2>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                {d.molecularFormula && <span className="chem-formula">{d.molecularFormula}</span>}
                                                {d.casNumber && <span className="badge badge-gray">CAS: {d.casNumber}</span>}
                                                {d.molecularWeight && <span className="badge badge-cyan">MW: {d.molecularWeight} g/mol</span>}
                                                {d.confidenceOverall && <span className="badge" style={{ background: 'transparent', border: `1px solid ${confColor(d.confidenceOverall)}`, color: confColor(d.confidenceOverall) }}>Confidence: {d.confidenceOverall}</span>}
                                            </div>
                                            {d.smiles && <div className="reaction-equation" style={{ fontSize: '0.78rem' }}>{d.smiles}</div>}
                                        </div>
                                        {pv && (
                                            <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem' }}>
                                                <div style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '0.4rem' }}>✓ PubChem Verified</div>
                                                <div>CID: <span className="font-mono">{pv.cid}</span></div>
                                                {pv.xlogp && <div>XLogP: <span className="font-mono">{pv.xlogp}</span></div>}
                                                {pv.tpsa && <div>TPSA: <span className="font-mono">{pv.tpsa} Ų</span></div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Physical Properties */}
                            {d.physicalProperties && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('phys')}>
                                        <Thermometer size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Physical Properties</span>
                                        <span>{open.phys ? '▲' : '▼'}</span>
                                    </div>
                                    {open.phys && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {Object.entries(d.physicalProperties).map(([k, v]) => v && (
                                                    <div key={k} className="property-item">
                                                        <div className="property-label">{k.replace(/([A-Z])/g, ' $1')}</div>
                                                        <div className="property-value" style={{ color: 'var(--cyan)' }}>{v.value || '—'}</div>
                                                        {v.confidence && <div className="property-unit" style={{ color: confColor(v.confidence) }}>● {v.confidence} confidence</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Solubility */}
                            {d.solubility && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('sol')}>
                                        <Droplet size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Solubility Profile</span>
                                        <span>{open.sol ? '▲' : '▼'}</span>
                                    </div>
                                    {open.sol && (
                                        <div className="result-section-body">
                                            <div className="grid-2" style={{ marginBottom: '1rem' }}>
                                                <div className="metric-card">
                                                    <div className="metric-label">Water Solubility</div>
                                                    <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>{d.solubility.waterSolubility?.value || '—'}</div>
                                                    {d.solubility.waterSolubility?.classification && <span className={`badge ${d.solubility.waterSolubility.classification === 'highly' ? 'badge-green' : 'badge-amber'}`}>{d.solubility.waterSolubility.classification}</span>}
                                                </div>
                                                <div className="metric-card">
                                                    <div className="metric-label">LogS</div>
                                                    <div className="metric-value" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>{d.solubility.waterSolubility?.logS || '—'}</div>
                                                </div>
                                            </div>
                                            {d.solubility.organicSolvents && (
                                                <div>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>Organic Solvents</div>
                                                    <div className="tags-list">
                                                        {Object.entries(d.solubility.organicSolvents).map(([s, lvl]) => (
                                                            <span key={s} className={`badge ${lvl === 'high' ? 'badge-green' : lvl === 'medium' ? 'badge-cyan' : 'badge-gray'}`}>{s}: {lvl}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Toxicology */}
                            {d.toxicology && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('tox')}>
                                        <Skull size={18} color="var(--red)" />
                                        <span className="result-section-title">Toxicology</span>
                                        <span>{open.tox ? '▲' : '▼'}</span>
                                    </div>
                                    {open.tox && (
                                        <div className="result-section-body">
                                            <div className="property-grid" style={{ marginBottom: '1rem' }}>
                                                {d.toxicology.LD50_oral_rat?.value && (
                                                    <div className="property-item">
                                                        <div className="property-label">LD50 Oral (Rat)</div>
                                                        <div className="property-value" style={{ color: 'var(--red)', fontSize: '1rem' }}>{d.toxicology.LD50_oral_rat.value}</div>
                                                        <div className="property-unit">mg/kg</div>
                                                    </div>
                                                )}
                                                {['carcinogenicity', 'mutagenicity', 'reproductiveToxicity', 'skinSensitization'].map(k => d.toxicology[k] && (
                                                    <div key={k} className="property-item">
                                                        <div className="property-label">{k.replace(/([A-Z])/g, ' $1')}</div>
                                                        <span className={`badge ${d.toxicology[k] === 'no' ? 'badge-green' : d.toxicology[k] === 'yes' ? 'badge-red' : 'badge-amber'}`}>{d.toxicology[k]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {d.toxicology.ghsHazardCodes?.length > 0 && (
                                                <div>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>GHS Hazard Codes</div>
                                                    <div className="tags-list">{d.toxicology.ghsHazardCodes.map(c => <span key={c} className="badge badge-red">{c}</span>)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ADME */}
                            {d.adme && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('adme')}>
                                        <Pill size={18} color="var(--green)" />
                                        <span className="result-section-title">ADME / Drug-likeness</span>
                                        <span>{open.adme ? '▲' : '▼'}</span>
                                    </div>
                                    {open.adme && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.adme.logP && <div className="property-item"><div className="property-label">LogP</div><div className="property-value font-mono" style={{ color: 'var(--cyan)' }}>{d.adme.logP}</div></div>}
                                                {d.adme.hbondDonors !== undefined && <div className="property-item"><div className="property-label">H-Bond Donors</div><div className="property-value">{d.adme.hbondDonors}</div></div>}
                                                {d.adme.hbondAcceptors !== undefined && <div className="property-item"><div className="property-label">H-Bond Acceptors</div><div className="property-value">{d.adme.hbondAcceptors}</div></div>}
                                                {d.adme.bioavailabilityScore && <div className="property-item"><div className="property-label">Bioavailability</div><div className="property-value" style={{ color: 'var(--green)' }}>{d.adme.bioavailabilityScore}</div></div>}
                                                {d.adme.bloodBrainBarrier && <div className="property-item"><div className="property-label">Blood-Brain Barrier</div><div className="property-value text-sm" style={{ paddingTop: '0.3rem' }}>{d.adme.bloodBrainBarrier}</div></div>}
                                                {d.adme.halfLife && <div className="property-item"><div className="property-label">Half-Life</div><div className="property-value text-sm" style={{ paddingTop: '0.3rem' }}>{d.adme.halfLife}</div></div>}
                                            </div>
                                            {d.adme.lipinskiRuleOf5 && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: d.adme.lipinskiRuleOf5.pass ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius: 'var(--radius-sm)', border: `1px solid ${d.adme.lipinskiRuleOf5.pass ? 'rgba(0,230,118,0.2)' : 'rgba(255,77,106,0.2)'}` }}>
                                                    <span style={{ fontWeight: 700, color: d.adme.lipinskiRuleOf5.pass ? 'var(--green)' : 'var(--red)' }}>
                                                        {d.adme.lipinskiRuleOf5.pass ? '✓' : '✗'} Lipinski Rule of Five: {d.adme.lipinskiRuleOf5.pass ? 'PASS' : 'FAIL'}
                                                    </span>
                                                    {formatViolations(d.adme.lipinskiRuleOf5.violations).length > 0 && (
                                                        <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Violations: {formatViolations(d.adme.lipinskiRuleOf5.violations).join(', ')}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HAZARD WARNINGS - Prominent at top if present */}
                            {d.toxicology?.hazardWarnings?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem', border: '2px solid var(--red)', background: 'var(--red-dim)' }}>
                                    <div className="result-section-header" style={{ background: 'transparent' }}>
                                        <AlertTriangle size={20} color="var(--red)" style={{ fontWeight: 700 }} />
                                        <span className="result-section-title" style={{ color: 'var(--red)', fontWeight: 700 }}>⚠️ Safety Hazards & Warnings</span>
                                    </div>
                                    <div className="result-section-body">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {d.toxicology.hazardWarnings.map((w, i) => (
                                                <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,77,106,0.1)', borderLeft: '3px solid var(--red)', borderRadius: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--red)' }}>• {w}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {d.toxicology.signalWord && <div style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--red)', fontSize: '1.1rem' }}>Signal Word: {d.toxicology.signalWord}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Regulatory & Compliance Section */}
                            {d.regulatory && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('reg')}>
                                        <AlertTriangle size={18} color="var(--purple)" />
                                        <span className="result-section-title">Regulatory & Compliance</span>
                                        <span>{open.reg ? '▲' : '▼'}</span>
                                    </div>
                                    {open.reg && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.regulatory.safetyGrade && <div className="property-item"><div className="property-label">Safety Classification</div><span className={`badge ${d.regulatory.safetyGrade.includes('Class I') ? 'badge-green' : d.regulatory.safetyGrade.includes('Class II') ? 'badge-cyan' : 'badge-amber'}`}>{d.regulatory.safetyGrade}</span></div>}
                                                {d.regulatory.epaStatus && <div className="property-item"><div className="property-label">EPA Status</div><div className="property-value text-sm">{d.regulatory.epaStatus}</div></div>}
                                                {d.regulatory.reachRegistration && <div className="property-item"><div className="property-label">REACH Registration</div><div className="property-value text-sm">{d.regulatory.reachRegistration}</div></div>}
                                                {d.regulatory.useFDA && <div className="property-item"><div className="property-label">FDA Status</div><div className="property-value text-sm">{d.regulatory.useFDA}</div></div>}
                                            </div>
                                            {d.regulatory.clpClassification?.length > 0 && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>CLP Classification</div>
                                                    <div className="tags-list">{d.regulatory.clpClassification.map((c, i) => <span key={i} className="badge badge-amber">{c}</span>)}</div>
                                                </div>
                                            )}
                                            {d.regulatory.industryApplications?.length > 0 && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>Approved Applications</div>
                                                    <div className="tags-list">{d.regulatory.industryApplications.map((a, i) => <span key={i} className="badge badge-green">{a}</span>)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stability & Handling */}
                            {d.stability && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('stab')}>
                                        <Thermometer size={18} color="var(--green)" />
                                        <span className="result-section-title">Stability & Handling</span>
                                        <span>{open.stab ? '▲' : '▼'}</span>
                                    </div>
                                    {open.stab && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.stability.thermalStability && <div className="property-item"><div className="property-label">Thermal Stability</div><div className="property-value text-sm">{d.stability.thermalStability}</div></div>}
                                                {d.stability.lightSensitivity && <div className="property-item"><div className="property-label">Light Sensitivity</div><span className={`badge ${d.stability.lightSensitivity.includes('not') ? 'badge-green' : 'badge-amber'}`}>{d.stability.lightSensitivity}</span></div>}
                                                {d.stability.moistureSensitivity && <div className="property-item"><div className="property-label">Moisture Sensitivity</div><span className={`badge ${d.stability.moistureSensitivity.includes('not') ? 'badge-green' : 'badge-amber'}`}>{d.stability.moistureSensitivity}</span></div>}
                                                {d.stability.storageCondition && <div className="property-item"><div className="property-label">Storage</div><div className="property-value text-sm">{d.stability.storageCondition}</div></div>}
                                                {d.stability.shelfLife && <div className="property-item"><div className="property-label">Shelf Life</div><div className="property-value text-sm">{d.stability.shelfLife}</div></div>}
                                            </div>
                                            {d.stability.incompatibilities?.length > 0 && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>Incompatible With</div>
                                                    <div className="tags-list">{d.stability.incompatibilities.map((inc, i) => <span key={i} className="badge badge-red">{inc}</span>)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Industrial Context */}
                            {d.industrialContext && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('ind')}>
                                        <LineChart size={18} color="var(--cyan)" />
                                        <span className="result-section-title">Industrial Suitability</span>
                                        <span>{open.ind ? '▲' : '▼'}</span>
                                    </div>
                                    {open.ind && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.industrialContext.scalability && <div className="property-item"><div className="property-label">Scalability</div><span className={`badge ${d.industrialContext.scalability.includes('industrial') ? 'badge-green' : 'badge-cyan'}`}>{d.industrialContext.scalability}</span></div>}
                                                {d.industrialContext.costIndicator && <div className="property-item"><div className="property-label">Cost</div><span className={`badge ${d.industrialContext.costIndicator === 'low' ? 'badge-green' : d.industrialContext.costIndicator === 'medium' ? 'badge-cyan' : 'badge-amber'}`}>{d.industrialContext.costIndicator}</span></div>}
                                                {d.industrialContext.commercialAvailability && <div className="property-item"><div className="property-label">Availability</div><div className="property-value text-sm">{d.industrialContext.commercialAvailability}</div></div>}
                                                {d.industrialContext.preferredVendors && <div className="property-item"><div className="property-label">Vendors</div><div className="property-value text-sm">{d.industrialContext.preferredVendors}</div></div>}
                                            </div>
                                            {d.industrialContext.suitability?.length > 0 && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>Suitable For</div>
                                                    <div className="tags-list">{d.industrialContext.suitability.map((s, i) => <span key={i} className="badge badge-green">{s}</span>)}</div>
                                                </div>
                                            )}
                                            {d.industrialContext.yieldOptimization && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--cyan-dim)', borderRadius: 'var(--radius-sm)' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.5rem' }}>Yield Optimization</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{d.industrialContext.yieldOptimization}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Alternative Compounds if Hazardous */}
                            {d.industrialContext?.alternativesIfHazardous?.length > 0 && (
                                <div className="result-section" style={{ marginBottom: '1rem', background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.2)' }}>
                                    <div className="result-section-header">
                                        <LineChart size={18} color="var(--green)" />
                                        <span className="result-section-title" style={{ color: 'var(--green)' }}>💡 Safer Alternatives</span>
                                    </div>
                                    <div className="result-section-body">
                                        {d.industrialContext.alternativesIfHazardous.map((alt, i) => (
                                            <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,230,118,0.05)', borderLeft: '3px solid var(--green)', borderRadius: '0.25rem', marginBottom: i < d.industrialContext.alternativesIfHazardous.length - 1 ? '0.75rem' : 0 }}>
                                                <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--green)' }}>• {alt.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reason: {alt.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Advanced Properties */}
                            {d.advancedProperties && (
                                <div className="result-section" style={{ marginBottom: '1rem' }}>
                                    <div className="result-section-header" onClick={() => toggle('adv')}>
                                        <Droplet size={18} color="var(--purple)" />
                                        <span className="result-section-title">Advanced Properties</span>
                                        <span>{open.adv ? '▲' : '▼'}</span>
                                    </div>
                                    {open.adv && (
                                        <div className="result-section-body">
                                            <div className="property-grid">
                                                {d.advancedProperties.conductivity && <div className="property-item"><div className="property-label">Conductivity</div><div className="property-value font-mono" style={{ color: 'var(--purple)' }}>{d.advancedProperties.conductivity.value} {d.advancedProperties.conductivity.unit}</div></div>}
                                                {d.advancedProperties.dipoleMoment && <div className="property-item"><div className="property-label">Dipole Moment</div><div className="property-value font-mono" style={{ color: 'var(--purple)' }}>{d.advancedProperties.dipoleMoment.value} {d.advancedProperties.dipoleMoment.unit}</div></div>}
                                                {d.advancedProperties.pKa && <div className="property-item"><div className="property-label">pKa</div><div className="property-value font-mono" style={{ color: 'var(--cyan)' }}>{d.advancedProperties.pKa.value}</div></div>}
                                                {d.advancedProperties.opticalProperties && <div className="property-item"><div className="property-label">Optical Properties</div><div className="property-value text-sm">{d.advancedProperties.opticalProperties}</div></div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {d.disclaimer && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.75rem', background: 'var(--amber-dim)', borderRadius: 'var(--radius-sm)' }}><AlertTriangle size={14} /> {d.disclaimer}</p>}
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="glass-card"><div className="analyzing-container">
                            <div style={{ background: 'var(--amber-dim)', padding: '1rem', borderRadius: '50%' }}>
                                <LineChart size={48} color="var(--amber)" />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Enter a molecule to predict properties</div>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380, fontSize: '0.875rem', lineHeight: 1.6 }}>
                                AI will predict physical, chemical, toxicological, and ADME properties before synthesis.
                            </p>
                        </div></div>
                    )}
                </div>
            </div>
        </div>
    )
}
