import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#0f1a2e',
                            color: '#e2e8f0',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            borderRadius: '12px',
                            fontFamily: 'Inter, sans-serif'
                        },
                        success: { iconTheme: { primary: '#00D4FF', secondary: '#0f1a2e' } },
                        error: { iconTheme: { primary: '#FF4D6A', secondary: '#0f1a2e' } }
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
)
