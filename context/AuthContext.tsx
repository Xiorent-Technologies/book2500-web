'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AuthContextType {
    isAuthenticated: boolean
    setIsAuthenticated: (value: boolean) => void
    logout: () => void
    checkAuth: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const updateAuthState = useCallback(() => {
        const token = localStorage.getItem('auth_token')
        setIsAuthenticated(!!token)
    }, [])

    // Initialize on mount
    useEffect(() => {
        updateAuthState()
    }, [updateAuthState])

    // Listen for auth changes
    useEffect(() => {
        const handleAuthChange = () => {
            updateAuthState()
        }

        window.addEventListener('auth-change', handleAuthChange)
        window.addEventListener('storage', handleAuthChange)

        return () => {
            window.removeEventListener('auth-change', handleAuthChange)
            window.removeEventListener('storage', handleAuthChange)
        }
    }, [updateAuthState])

    const checkAuth = useCallback(() => {
        updateAuthState()
    }, [updateAuthState])

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        setIsAuthenticated(false)
        window.dispatchEvent(new Event('auth-change'))
    }, [])

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
