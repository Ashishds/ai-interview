/**
 * AuthGuard — Client-side route protection component.
 *
 * Wraps any page that requires authentication and/or a specific role.
 * - Redirects unauthenticated users to /auth/login
 * - Redirects wrong-role users to their correct dashboard
 * - Shows a loading spinner while auth state is being determined
 *
 * Usage:
 *   // Require any authentication
 *   <AuthGuard>{children}</AuthGuard>
 *
 *   // Require a specific role
 *   <AuthGuard requiredRole="recruiter">{children}</AuthGuard>
 *   <AuthGuard requiredRole="candidate">{children}</AuthGuard>
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'recruiter' | 'candidate' | 'admin'
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, role } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      // Not logged in — send to login with the required role pre-selected
      const loginRole = requiredRole ?? 'candidate'
      router.replace(`/auth/login?role=${loginRole}`)
      return
    }

    // Logged in but wrong role
    if (requiredRole && role !== requiredRole && role !== 'admin') {
      // Redirect to correct dashboard
      if (role === 'recruiter') {
        router.replace('/recruiter/jobs')
      } else {
        router.replace('/candidate/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, role, requiredRole, router])

  // While checking auth state, show a centered spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 gap-4">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className="text-sm text-surface-500 font-medium animate-pulse">Verifying your session...</p>
      </div>
    )
  }

  // If not authenticated or wrong role, render nothing (redirect happening)
  if (!isAuthenticated) return null
  if (requiredRole && role !== requiredRole && role !== 'admin') return null

  return <>{children}</>
}
