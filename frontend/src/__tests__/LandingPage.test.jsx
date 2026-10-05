import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, it, expect, vi } from 'vitest'

import LandingPage from '../pages/LandingPage'
import api from '../services/api'
import { clearPublicCache } from '../services/publicCache'

// ----------------------------------------------------------------
// Mocks: swap real dependencies with fake ones so the test is
// isolated from the network and from real browser-only animation.
// ----------------------------------------------------------------

// 1. Mock the API service. The real one would hit the backend over
//    the network; our fake just returns whatever the test tells it to.
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// 2. Mock framer-motion. Its scroll/animation features rely on browser
//    APIs that jsdom does not implement (IntersectionObserver, etc).
//    We replace every motion.* element with a plain HTML element of
//    the same tag and make useAnimation() return harmless no-ops.
vi.mock('framer-motion', async () => {
  const React = (await import('react')).default
  return {
    motion: new Proxy({}, {
      get: (_, tag) => (props) => React.createElement(tag, props),
    }),
    useAnimation: () => ({
      start: vi.fn(),
      set: vi.fn(),
    }),
  }
})

// Sample event data returned by the mocked api.get('/events')
const sampleEvents = [
  {
    id: 1,
    title: 'Hackathon',
    category: 'Tech',
    description: 'Build something awesome',
    venue: 'Tech Lab',
    date: '2027-01-15',
    status: 'approved',
    attendees: 40,
    image: null,
  },
  {
    id: 2,
    title: 'Music Fest',
    category: 'Music',
    description: 'Live concert on campus',
    venue: 'Main Auditorium',
    date: '2027-02-10',
    status: 'approved',
    attendees: 120,
    image: null,
  },
]

// renderWithRouter wraps the component in a MemoryRouter because
// LandingPage uses <Link> from react-router-dom, which needs to be
// inside a router to know its current location.
function LocationDisplay() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
      <LocationDisplay />
    </MemoryRouter>
  )
}

// ----------------------------------------------------------------
// Tests: Arrange -> Act -> Assert
// ----------------------------------------------------------------

describe('LandingPage', () => {
  // Reset mocks and any leftover session state before every test.
  beforeEach(() => {
    vi.clearAllMocks()
    clearPublicCache('events')
    sessionStorage.setItem('nexusGateOpened', 'true') // skip the door animation
  })

  it('shows a loading state while the events are being fetched', () => {
    // Arrange: make api.get('/events') never resolve (simulates slow network).
    api.get.mockReturnValue(new Promise(() => {}))

    // Act: render the page.
    renderLandingPage()

    // Assert: the loading screen is visible, and events are NOT yet shown.
    expect(screen.getByText('Preparing your campus events')).toBeInTheDocument()
    expect(screen.queryByText('Hackathon')).not.toBeInTheDocument()
  })

  it('renders event cards and stats after the events load', async () => {
    // Arrange: the fake API returns our two sample events.
    api.get.mockResolvedValue({ data: sampleEvents })

    // Act: render the page.
    renderLandingPage()

    // Assert: the loading screen disappears and the event titles appear.
    // findAllByText polls until elements show up (async).
    // The title appears twice: once in the "live events" hero card and
    // once in the featured events grid, hence findBy*AllText.
    expect((await screen.findAllByText('Hackathon')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Music Fest')).length).toBeGreaterThan(0)

    // Assert: the "Registrations" stat shows the right number.
    // We scope the query: find the element with the label text, then check
    // its parent (.stat) contains both the number and the label.
    // This avoids breaking because '2' appears in several stat boxes.
    const registrationsStat = screen
      .getByText('Registrations')
      .parentElement

    expect(registrationsStat).toHaveTextContent('160')

    // All three of Events Hosted / Upcoming / Categories are 2.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(3)
  })

  it('calls the events API exactly once on mount', () => {
    // Arrange
    api.get.mockResolvedValue({ data: [] })

    // Act
    renderLandingPage()

    // Assert: the component requested /events from the API.
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/events')
  })

  it('sends a landing-page search to the public events page', async () => {
    api.get.mockResolvedValue({ data: [] })
    renderLandingPage()

    fireEvent.change(await screen.findByRole('textbox', { name: 'Search public events' }), {
      target: { value: 'robotics club' },
    })
    fireEvent.submit(screen.getByRole('search'))

    expect(screen.getByTestId('location')).toHaveTextContent('/events?search=robotics%20club')
  })

  it('opens an uncluttered mobile navigation menu', async () => {
    api.get.mockResolvedValue({ data: [] })
    renderLandingPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Open navigation menu' }))

    const menu = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(within(menu).getByRole('link', { name: 'Event calendar' })).toHaveAttribute('href', '/calendar')
    expect(within(menu).getByRole('link', { name: 'Past events' })).toHaveAttribute('href', '/events/past')
    expect(within(menu).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })
})
