import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get('/auth/me').then(res => setUser(res.data.user)).catch(() => setUser(null)).finally(() => setLoading(false))
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        setUser(res.data.user)
        return res.data
    }

    const register = async (name, email, password, organization, role) => {
        const res = await api.post('/auth/register', { name, email, password, organization, role })
        setUser(res.data.user)
        return res.data
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) { }
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, api }}>
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
