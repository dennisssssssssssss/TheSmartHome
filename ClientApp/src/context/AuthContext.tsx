import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { decodeJwtPayload } from '@/lib/jwt'
import type { RegisterRequest } from '@/types'

interface AuthContextType {
  isAuthenticated: boolean
  isAuthReady: boolean
  login: (username: string, password: string) => Promise<void>
  register: (registration: RegisterRequest) => Promise<void>
  logout: () => void
  username: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUsername = localStorage.getItem('username')
    if (token) {
      try {
        const payload = decodeJwtPayload(token)
        if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('username')
          setIsAuthenticated(false)
          setUsername(null)
          setIsAuthReady(true)
          return
        }
        setIsAuthenticated(true)
        setUsername(savedUsername || payload.sub || null)
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('username')
        setIsAuthenticated(false)
        setUsername(null)
      }
    }
    setIsAuthReady(true)
  }, [])

  const login = async (username: string, password: string) => {
    const user = await api.auth.login(username, password)
    setIsAuthenticated(true)
    setUsername(user.username)
    localStorage.setItem('username', user.username)
  }

  const register = async (registration: RegisterRequest) => {
    const user = await api.auth.register(registration)
    setIsAuthenticated(true)
    setUsername(user.username)
    localStorage.setItem('username', user.username)
  }

  const logout = () => {
    api.auth.logout()
    setIsAuthenticated(false)
    setUsername(null)
    localStorage.removeItem('username')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthReady, login, register, logout, username }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
