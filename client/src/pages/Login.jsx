import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(form.email, form.password)
            toast.success('Welcome back! 🧪')
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🧪</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>ChemistAI</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI-Powered Chemistry Platform</div>
                    </div>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-group">
                            <span className="input-prefix">✉️</span>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                required autoFocus />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                            <span className="input-prefix">🔒</span>
                            <input type="password" className="form-input" placeholder="••••••••"
                                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                        style={{ marginTop: '0.5rem' }}>
                        {loading ? <><span>⌛</span> Signing in...</> : <><span>🔑</span> Sign In</>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>
                        Create one →
                    </Link>
                </p>
            </div>
        </div>
    )
}
