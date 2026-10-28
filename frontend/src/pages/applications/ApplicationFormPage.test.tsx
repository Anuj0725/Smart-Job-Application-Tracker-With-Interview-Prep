import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ApplicationFormPage } from '@/pages/applications/ApplicationFormPage'
import * as applicationsApi from '@/lib/applications-api'

vi.mock('@/lib/applications-api')

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ApplicationFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ApplicationFormPage', () => {
  beforeEach(() => {
    vi.mocked(applicationsApi.createApplication).mockReset()
  })

  it('submits typed application fields', async () => {
    vi.mocked(applicationsApi.createApplication).mockResolvedValue({ id: 'new-1' } as applicationsApi.ApplicationDetail)
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/company/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer')
    await user.type(screen.getByLabelText(/date applied/i), '2026-01-15')
    await user.click(screen.getByRole('button', { name: /create application/i }))

    await waitFor(() =>
      expect(applicationsApi.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Acme Corp',
          job_title: 'Software Engineer',
          date_applied: '2026-01-15',
        }),
      ),
    )
  })
})
