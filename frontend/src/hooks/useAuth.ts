/**
 * useAuth — Central authentication hook for HireAI.
 *
 * The single source of truth for:
 *   - Current user data (id, email, role, profile)
 *   - Authentication state (isAuthenticated)
 *   - Auth token for API calls
 *   - Logout function
 *
 * Usage:
 *   const { user, token, role, isAuthenticated, logout } = useAuth()
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  role: 'recruiter' | 'candidate' | 'admin'
  profile?: {
    full_name?: string
    avatar_url?: string
    company_name?: string
    headline?: string
    skills?: string[]
    resume_url?: string
    experience_years?: number
    parsed_data?: Record<string, unknown>
  }
  created_at?: string
}

export interface UseAuthReturn {
  user: AuthUser | null
  token: string | null
  role: 'recruiter' | 'candidate' | 'admin' | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
  getInitials: () => string
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Runs only on client — localStorage is not available during SSR
    const storedToken = localStorage.getItem('hireai_token')
    const storedUser = localStorage.getItem('hireai_user')

    if (storedToken && storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('hireai_token')
        localStorage.removeItem('hireai_user')
      }
    }
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hireai_token')
    localStorage.removeItem('hireai_user')
    setUser(null)
    setToken(null)
    router.push('/auth/login')
  }, [router])

  const getInitials = useCallback((): string => {
    if (!user?.profile?.full_name) return 'U'
    const parts = user.profile.full_name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [user])

  return {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: !!token && !!user,
    isLoading,
    logout,
    getInitials,
  }
}
