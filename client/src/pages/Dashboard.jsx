import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, api } from '../context/AuthContext'
import { FlaskConical, Microscope, LineChart, Network, Target, ScrollText, Settings, Atom, Hexagon, Sparkles, Activity } from 'lucide-react'

const useCases = [
    {
        to: '/manufacturing', icon: <FlaskConical size={24} />, badge: 'UC1',
        title: 'Manufacturing Planner',
        desc: 'Green chemistry synthesis routes with step-by-step reactions, chemical list, consumption norms & cost estimation.',
        color: 'var(--cyan)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)'
    },
    {
        to: '/optimize', icon: <Microscope size={24} />, badge: 'UC2',
        title: 'Reaction Optimizer',
        desc: 'Suggest alternative chemicals and optimized parameters (temp, pressure, flow) for better yield.',
        color: 'var(--purple)', bg: 'rgba(123,47,255,0.08)', border: 'rgba(123,47,255,0.2)'
    },
    {
        to: '/properties', icon: <LineChart size={24} />, badge: 'UC3',
        title: 'Property Prediction',
        desc: 'Predict boiling point, toxicity, solubility, conductivity, and ADME profile before synthesis.',
        color: 'var(--amber)', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.2)'
    },
    {
        to: '/retrosynthesis', icon: <Network size={24} />, badge: 'UC4',
        title: 'Retrosynthesis Planning',
        desc: 'Deconstruct complex target molecules into commercially available starting materials.',
        color: 'var(--green)', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)'
    },
    {
        to: '/predict', icon: <Target size={24} />, badge: 'UC5',
        title: 'Reaction Outcome',
        desc: 'Predict reaction yield, major products, and side-products to reduce waste and R&D cost.',
        color: '#FF6B9D', bg: 'rgba(255,107,157,0.08)', border: 'rgba(255,107,157,0.2)'
    },
    {
        to: '/patents', icon: <ScrollText size={24} />, badge: 'UC6',
        title: 'Patent Analysis',
        desc: 'Freedom-to-operate analysis scanning USPTO patents for structural motifs and synthesis routes.',
        color: '#FFA352', bg: 'rgba(255,163,82,0.08)', border: 'rgba(255,163,82,0.2)'
    }
]

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)

    useEffect(() => {
        api.get('/history/user/stats').then(r => setStats(r.data)).catch(() => { })
    }, [])

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="fade-in">
            {/* Premium Hero Section */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(123, 47, 255, 0.08) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem',
                marginBottom: '2.5rem',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Background Animations */}
                <div style={{ position: 'absolute', top: -100, right: -50, opacity: 0.15, pointerEvents: 'none', animation: 'spin 40s linear infinite' }}>
                    <Atom size={400} color="var(--cyan)" strokeWidth={0.5} />
                </div>
                <div style={{ position: 'absolute', bottom: -50, left: -50, opacity: 0.1, pointerEvents: 'none', animation: 'spin 30s linear infinite reverse' }}>
                    <Hexagon size={250} color="var(--purple)" strokeWidth={0.5} />
                </div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Sparkles size={16} color="var(--amber)" />
                        <span style={{ color: 'var(--amber)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                            {greeting}, {user?.name?.split(' ')[0] || 'Chemist'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.8rem', lineHeight: 1.1, marginBottom: '1.25rem', fontWeight: 800 }}>
                        Next-Gen <br/><span className="gradient-text">Chemistry Intelligence</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Accelerate your R&D lifecycle with AI-driven reaction optimization, property prediction methodologies, and comprehensive patent intelligence.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/manufacturing" className="btn btn-primary btn-lg pulse-glow" style={{ padding: '0.8rem 2rem', border: 'none' }}>
                            <FlaskConical size={18} /> Start Planning
                        </Link>
                        <Link to="/history" className="btn btn-secondary btn-lg" style={{ padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Activity size={18} /> View History
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid-4" style={{ marginBottom: '2rem' }}>
                <div className="metric-card">
                    <div className="metric-label">Total Queries</div>
                    <div className="metric-value gradient-text">{stats?.total ?? '—'}</div>
                    <div className="metric-sub">All time</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">AI Model</div>
                    <div className="metric-value" style={{ fontSize: '1rem', paddingTop: '0.5rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                        GPT-4o-mini
                    </div>
                    <div className="metric-sub">Free tier active</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Use Cases</div>
                    <div className="metric-value gradient-text">6</div>
                    <div className="metric-sub">Active modules</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px var(--green)' }} />
                        <span style={{ fontWeight: 700, color: 'var(--green)' }}>Online</span>
                    </div>
                    <div className="metric-sub">APIs operational</div>
                </div>
            </div>



            {/* Use Case Cards */}
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                <span className="gradient-text">AI Modules</span>
            </h2>
            <div className="use-case-grid">
                {useCases.map(uc => (
                    <Link key={uc.to} to={uc.to} className="use-case-card" style={{ '--uc-color': uc.color }}>
                        <div style={{ position: 'absolute', inset: 0, background: uc.bg, opacity: 0, transition: 'opacity 0.2s' }}
                            className="uc-hover-bg" />
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="uc-icon" style={{ background: uc.bg, border: `1px solid ${uc.border}` }}>
                                    {uc.icon}
                                </div>
                                <span className="badge" style={{ background: uc.bg, color: uc.color, border: `1px solid ${uc.border}`, fontSize: '0.65rem' }}>
                                    {uc.badge}
                                </span>
                            </div>
                            <div>
                                <div className="uc-title" style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{uc.title}</div>
                                <div className="uc-desc">{uc.desc}</div>
                            </div>
                            <div className="uc-arrow" style={{ color: uc.color }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Open Module</span>
                                <span>→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            {stats?.byUseCase?.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your Activity</h2>
                    <div className="glass-card">
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.byUseCase.map(item => (
                                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ width: 80, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{item._id}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${Math.min(100, (item.count / stats.total) * 100)}%` }} />
                                            </div>
                                        </div>
                                        <span style={{ width: 30, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)' }}>{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
