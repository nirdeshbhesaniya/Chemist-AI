import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Type, Dna, PenTool, ClipboardCheck, X } from 'lucide-react'

/**
 * Shared molecule input component
 * Supports: text name, SMILES string, Ketcher editor
 */
export default function MoleculeInput({ value, onChange, onSmilesChange, smilesValue, label = 'Target Molecule', required = true }) {
    const [inputType, setInputType] = useState('name') // 'name' | 'smiles' | 'ketcher'
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [ketcherReady, setKetcherReady] = useState(false)
    const iframeRef = useRef(null)

    const getSmiles = async () => {
        if (!iframeRef.current) return ''
        try {
            iframeRef.current.contentWindow.postMessage({ type: 'cmd', value: 'getSmiles' }, '*')
            return new Promise(res => {
                const handler = e => {
                    if (e.data?.type === 'smiles') { window.removeEventListener('message', handler); res(e.data.value) }
                }
                window.addEventListener('message', handler)
                setTimeout(() => { window.removeEventListener('message', handler); res('') }, 3000)
            })
        } catch { return '' }
    }

    return (
        <div>
            {label && <label className="form-label">{label}</label>}

            <div className="input-type-toggle">
                <button type="button" className={`toggle-btn${inputType === 'name' ? ' active' : ''}`}
                    onClick={() => setInputType('name')}>
                    <Type size={16} /> Name
                </button>
                <button type="button" className={`toggle-btn${inputType === 'smiles' ? ' active' : ''}`}
                    onClick={() => setInputType('smiles')}>
                    <Dna size={16} /> SMILES
                </button>
                <button type="button" className={`toggle-btn${inputType === 'ketcher' ? ' active' : ''}`}
                    onClick={() => { setInputType('ketcher'); setIsEditorOpen(true); }}>
                    <PenTool size={16} /> Draw Structure
                </button>
            </div>

            {inputType === 'name' && (
                <div>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Aspirin, Paracetamol, Ibuprofen, Caffeine..."
                        value={value}
                        onChange={e => onChange(e.target.value, 'name')}
                        required={required}
                    />
                    <p className="form-hint">Enter IUPAC name, common name, or trade name</p>
                </div>
            )}

            {inputType === 'smiles' && (
                <div>
                    <textarea
                        className="form-input form-textarea"
                        placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O  (Aspirin SMILES)"
                        value={smilesValue || value}
                        onChange={e => {
                            const val = e.target.value
                            if (onSmilesChange) onSmilesChange(val)
                            onChange(val, 'smiles')
                        }}
                        required={required}
                        style={{ minHeight: '80px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    />
                    <p className="form-hint">Enter canonical or isomeric SMILES string</p>
                </div>
            )}

            {inputType === 'ketcher' && (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px dashed var(--cyan-border)', borderRadius: 'var(--radius-md)' }}>
                    <PenTool size={48} color="var(--cyan)" style={{ marginBottom: '1rem', opacity: 0.5, display: 'inline-block' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Interactive Structure Editor</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem', maxWidth: 300, margin: '0 auto 1.5rem' }}>Draw your target molecule precisely in the full-screen interactive canvas.</p>
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => setIsEditorOpen(true)}>
                        Open Canvas Editor
                    </button>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Powered by JSME Editor</div>
                </div>
            )}

            {isEditorOpen && typeof document !== 'undefined' && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(5, 11, 24, 0.95)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', padding: '2vw' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', border: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}><PenTool size={20} color="var(--cyan)" /> Chemical Structure Canvas</h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setIsEditorOpen(false)}>
                                <X size={18} /> Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={async () => {
                                const smiles = await getSmiles()
                                if (smiles) {
                                    if (onSmilesChange) onSmilesChange(smiles)
                                    onChange(smiles, 'smiles')
                                    setInputType('smiles')
                                    setIsEditorOpen(false)
                                    toast.success('Structure perfectly captured!')
                                } else {
                                    toast.error('Could not capture SMILES. Is the canvas empty?')
                                }
                            }}>
                                <ClipboardCheck size={18} /> Use Drawn Structure
                            </button>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: '#fff', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', borderTop: 'none' }}>
                        <iframe
                            ref={iframeRef}
                            src="/editor.html"
                            title="Interactive Chemical Structure Editor"
                            onLoad={() => setKetcherReady(true)}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="fullscreen"
                        />
                    </div>
                </div>, document.body
            )}
        </div>
    )
}
