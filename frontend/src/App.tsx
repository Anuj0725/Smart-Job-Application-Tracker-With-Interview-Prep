import { Link, Route, Routes } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotFoundPage } from '@/pages/NotFoundPage'

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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
