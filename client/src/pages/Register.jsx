import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', organization: '', role: 'chemist' })
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
        setLoading(true)
        try {
            await register(form.name, form.email, form.password, form.organization, form.role)
            toast.success('Account created! Welcome to ChemistAI 🧪')
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🧪</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>ChemistAI</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Free for Demo</div>
                    </div>
                </div>

                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join ChemistAI for AI-powered chemistry insights</p>

                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" placeholder="Dr. Jane Smith" value={form.name} onChange={set('name')} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={form.role} onChange={set('role')}>
                                <option value="chemist">Chemist</option>
                                <option value="researcher">Researcher</option>
                                <option value="student">Student</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="you@example.com"
                            value={form.email} onChange={set('email')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Organization (optional)</label>
                        <input className="form-input" placeholder="University / Company"
                            value={form.organization} onChange={set('organization')} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="Min. 6 characters"
                            value={form.password} onChange={set('password')} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                        style={{ marginTop: '0.5rem' }}>
                        {loading ? '⌛ Creating account...' : '🚀 Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in →
                    </Link>
                </p>
            </div>
        </div>
    )
}
