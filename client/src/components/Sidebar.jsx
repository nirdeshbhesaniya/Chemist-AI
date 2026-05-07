import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LayoutDashboard, FlaskConical, Microscope, LineChart, Network, Target, ScrollText, History, LogOut, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { to: '/manufacturing', label: 'Manufacturing', icon: <FlaskConical size={20} />, badge: 'UC1' },
    { to: '/optimize', label: 'Reaction Optimizer', icon: <Microscope size={20} />, badge: 'UC2' },
    { to: '/properties', label: 'Property Prediction', icon: <LineChart size={20} />, badge: 'UC3' },
    { to: '/retrosynthesis', label: 'Retrosynthesis', icon: <Network size={20} />, badge: 'UC4' },
    { to: '/predict', label: 'Outcome Prediction', icon: <Target size={20} />, badge: 'UC5' },
    { to: '/patents', label: 'Patent Analysis', icon: <ScrollText size={20} />, badge: 'UC6' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CA'

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon" style={{ padding: '4px' }}>
                    <FlaskConical color="#fff" size={24} />
                </div>
                <div>
                    <h2>ChemistAI</h2>
                    <span>ALPHA</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <p className="nav-section-label">Navigation</p>
                {navItems.slice(0, 1).map(item => (
                    <NavLink key={item.to} to={item.to} end={item.exact}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}

                <p className="nav-section-label" style={{ marginTop: '1.25rem' }}>AI Use Cases</p>
                {navItems.slice(1).map(item => (
                    <NavLink key={item.to} to={item.to}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </NavLink>
                ))}

                <p className="nav-section-label" style={{ marginTop: '1.25rem' }}>Account</p>
                <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <span className="nav-icon"><History size={20} /></span>
                    Query History
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{initials}</div>
                    <div>
                        <div className="user-name">{user?.name || 'Chemist'}</div>
                        <div className="user-role">{user?.role || 'chemist'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="logout-btn" onClick={toggleTheme} style={{ flex: 1, marginTop: 0, justifyContent: 'center' }}>
                        {theme === 'dark' ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
                    </button>
                    <button className="logout-btn" onClick={handleLogout} style={{ flex: 1, marginTop: 0, justifyContent: 'center' }}>
                        <LogOut size={18} /> Exit
                    </button>
                </div>
            </div>
        </aside>
    )
}
