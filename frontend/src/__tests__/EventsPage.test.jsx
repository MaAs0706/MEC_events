import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EventsPage from '../pages/EventsPage'
import api from '../services/api'
import { clearPublicCache } from '../services/publicCache'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

const events = [
  {
    id: 1,
    title: 'Robotics Workshop',
    category: 'Tech',
    description: 'Build autonomous machines.',
    venue: 'Tech Lab',
    organizer: 'Robotics Club',
    date: '2027-01-15',
  },
  {
    id: 2,
    title: 'Acoustic Night',
    category: 'Music',
    description: 'A campus concert.',
    venue: 'Main Auditorium',
    organizer: 'Music Club',
    date: '2027-01-16',
  },
]

describe('EventsPage public search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPublicCache('events')
  })

  it('filters approved public events from the landing-page search parameter', async () => {
    api.get.mockResolvedValue({ data: events })

    render(
      <MemoryRouter initialEntries={['/events?search=robotics']}>
        <EventsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Robotics Workshop')).toBeInTheDocument()
    expect(screen.queryByText('Acoustic Night')).not.toBeInTheDocument()
    expect(screen.getByText('Showing approved events matching “robotics”.')).toBeInTheDocument()
  })
})
