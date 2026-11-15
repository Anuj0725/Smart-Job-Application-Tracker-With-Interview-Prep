import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { SessionExpiredScreen } from '@/components/shared/SessionExpiredScreen'

/** Gate for any route tree that requires a logged-in user (US-01..04).
 * Renders a loading placeholder while the session is being resolved (token
 * present but profile not yet fetched/refreshed), otherwise redirects to
 * /login — preserving the attempted location so login can return here. */
export function ProtectedRoute({ signedOutHome }: { signedOutHome?: ReactNode } = {}) {
  const { isAuthenticated, isLoading, sessionMessage } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground" role="status" aria-label="Checking session">
        Loading
      </div>
    )
  }

  if (!isAuthenticated) {
    if (sessionMessage) {
      return <SessionExpiredScreen from={location} />
    }
    if (signedOutHome && location.pathname === '/') {
      return <>{signedOutHome}</>
    }
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
