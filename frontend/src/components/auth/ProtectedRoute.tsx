import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

/** Gate for any route tree that requires a logged-in user (US-01..04).
 * Renders a loading placeholder while the session is being resolved (token
 * present but profile not yet fetched/refreshed), otherwise redirects to
 * /login — preserving the attempted location so login can return here. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground" role="status" aria-label="Checking session">
        Loading
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
