import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
        <CompassIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-lg font-semibold">This page doesn't exist</h1>
        <p className="text-sm text-muted-foreground">
          The link may be broken, or the page may have moved.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Return home
      </Link>
    </div>
  )
}
