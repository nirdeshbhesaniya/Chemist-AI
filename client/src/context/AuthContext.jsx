import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Use VITE_API_URL from environment or fallback to relative path for production
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ 
    baseURL: API_URL, 
    withCredentials: true 
})

api.interceptors.response.use(
    res => res,
    err => {
        // Only redirect to login if it's a 401 and we're not already on an auth page
        if (err.response?.status === 401) {
            const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register')
            if (!isAuthPage) {
                // Clear user state before redirecting
                // Note: We use window.location.href for a clean state reset on 401
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    }
)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/me')
            if (res.data.success) {
                setUser(res.data.user)
            } else {
                // Fallback for demo
                setUser({ name: 'Demo Chemist', email: 'demo@chemistai.com', role: 'chemist' })
            }
        } catch (error) {
            // Fallback for demo
            setUser({ name: 'Demo Chemist', email: 'demo@chemistai.com', role: 'chemist' })
        } finally {
            setLoading(false)
        }
    }



    useEffect(() => {
        checkAuth()
    }, [])

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password })
            if (res.data.success) {
                setUser(res.data.user)
            }
            return res.data
        } catch (error) {
            throw error
        }
    }

    const register = async (name, email, password, organization, role) => {
        try {
            const res = await api.post('/auth/register', { name, email, password, organization, role })
            if (res.data.success) {
                setUser(res.data.user)
            }
            return res.data
        } catch (error) {
            throw error
        }
    }


    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            console.error('Logout failed:', e)
        } finally {
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, api, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}

export { api }

