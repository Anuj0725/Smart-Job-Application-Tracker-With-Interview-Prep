import { Link, Route, Routes } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ApplicationsListPage } from '@/pages/applications/ApplicationsListPage'
import { ApplicationDetailPage } from '@/pages/applications/ApplicationDetailPage'
import { ApplicationFormPage } from '@/pages/applications/ApplicationFormPage'

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <BrandMark />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Smart Job Application Tracker</h1>
        <p className="text-muted-foreground">
          Track your job applications and prepare for interviews.
        </p>
      </div>
      <ThemeToggle />
      <nav className="flex gap-4 text-sm font-medium">
        <Link to="/" className="text-primary hover:underline">
          Home
        </Link>
        <Link to="/applications" className="text-primary hover:underline">
          Applications
        </Link>
        <Link to="/login" className="text-primary hover:underline">
          Log in
        </Link>
        <Link to="/register" className="text-primary hover:underline">
          Register
        </Link>
        <Link to="/not-found-preview" className="text-muted-foreground hover:underline">
          404 Page
        </Link>
      </nav>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/applications" element={<ApplicationsListPage />} />
          <Route path="/applications/new" element={<ApplicationFormPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
