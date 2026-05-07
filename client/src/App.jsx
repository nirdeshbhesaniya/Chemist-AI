import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Manufacturing from './pages/Manufacturing'
import Optimize from './pages/Optimize'
import Properties from './pages/Properties'
import Retrosynthesis from './pages/Retrosynthesis'
import Predict from './pages/Predict'
import Patents from './pages/Patents'
import History from './pages/History'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="loading-screen">
            <div className="loading-orb" />
            <p>Loading ChemistAI...</p>
        </div>
    )
    return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return null
    return !user ? children : <Navigate to="/" replace />
}

export default function App() {
    return (
        <ThemeProvider>
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="manufacturing" element={<Manufacturing />} />
                    <Route path="optimize" element={<Optimize />} />
                    <Route path="properties" element={<Properties />} />
                    <Route path="retrosynthesis" element={<Retrosynthesis />} />
                    <Route path="predict" element={<Predict />} />
                    <Route path="patents" element={<Patents />} />
                    <Route path="history" element={<History />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    )
}
