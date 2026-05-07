import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
    const token = localStorage.getItem('chemist_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('chemist_token')
            localStorage.removeItem('chemist_user')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('chemist_token')
        const savedUser = localStorage.getItem('chemist_user')
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser))
                api.get('/auth/me').then(res => setUser(res.data.user)).catch(() => {
                    localStorage.removeItem('chemist_token')
                    localStorage.removeItem('chemist_user')
                    setUser(null)
                })
            } catch { setUser(null) }
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        localStorage.setItem('chemist_token', res.data.token)
        localStorage.setItem('chemist_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return res.data
    }

    const register = async (name, email, password, organization, role) => {
        const res = await api.post('/auth/register', { name, email, password, organization, role })
        localStorage.setItem('chemist_token', res.data.token)
        localStorage.setItem('chemist_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return res.data
    }

    const logout = () => {
        localStorage.removeItem('chemist_token')
        localStorage.removeItem('chemist_user')
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
