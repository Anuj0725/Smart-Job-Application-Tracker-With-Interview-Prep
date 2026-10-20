import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders 404 message and return home link', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("This page doesn't exist")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return home/i })).toHaveAttribute('href', '/')
  })
})
