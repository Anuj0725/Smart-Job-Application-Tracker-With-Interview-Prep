import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { listApplications, type ApplicationSummary } from '@/lib/applications-api'
import { listInterviews } from '@/lib/interviews-api'
import { useAuth } from '@/hooks/use-auth'

vi.mock('@/hooks/use-auth')
vi.mock('@/lib/applications-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/applications-api')>('@/lib/applications-api')
  return { ...actual, listApplications: vi.fn() }
})
vi.mock('@/lib/interviews-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/interviews-api')>('@/lib/interviews-api')
  return { ...actual, listInterviews: vi.fn() }
})

function application(overrides: Partial<ApplicationSummary> = {}): ApplicationSummary {
  return {
    id: 'app-1',
    company: { id: 'company-1', name: 'Acme', website: null, industry: null },
    job_title: 'Engineer',
    status: 'APPLIED',
    current_stage: 'APPLIED',
    days_in_stage: 1,
    date_applied: '2026-01-01',
    priority: null,
    archived: false,
    allowed_next_statuses: [],
    correction_statuses: [],
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'jane@example.com', display_name: 'Jane Doe', target_role: null, graduation_year: null, target_date: null, onboarded: true, timezone: null, fl_opt_in: false, fl_privacy_posture: 'balanced', created_at: '' },
      isLoading: false,
      isAuthenticated: true,
      sessionMessage: null,
      login: vi.fn(),
      register: vi.fn(),
      confirmEmail: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(listApplications).mockReset()
    vi.mocked(listInterviews).mockReset()
  })

  it('shows loading skeletons before data arrives', () => {
    vi.mocked(listApplications).mockReturnValue(new Promise(() => {}))
    vi.mocked(listInterviews).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByTestId('pipeline-loading')).toBeInTheDocument()
  })

  it('renders the pipeline strip and page heading', async () => {
    vi.mocked(listApplications).mockResolvedValue({ items: [application()], total: 1, page: 0, size: 500 })
    vi.mocked(listInterviews).mockResolvedValue({ items: [], total: 0, page: 0, size: 50 })

    renderPage()

    expect(await screen.findByTestId('pipeline-strip')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /schedule an interview/i })).toHaveAttribute('href', '/interviews/new')
  })
})
