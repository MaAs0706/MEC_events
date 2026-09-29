import React, { useEffect, useRef, useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { signOut } from '../services/auth'
import NotificationBell from '../components/NotificationBell'

import {
  Calendar,
  Building2,
  FileText,
  Users,
  BarChart3,
  Download,
  LogOut
} from 'lucide-react'

import './CoordinatorDashboard.css'

function CoordinatorDashboard() {

  const today = new Date()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] =
    useState('calendar')

  const [selectedDate, setSelectedDate] =
    useState(today.getDate())

  const [visibleMonth, setVisibleMonth] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    )

  const [selectedVenue, setSelectedVenue] =
    useState('')

  const [showCreateForm, setShowCreateForm] =
    useState(false)

  const [myEvents, setMyEvents] =
    useState([])

  const [formError, setFormError] =
    useState('')

  const [formData, setFormData] =
    useState({
      title: '',
      description: '',
      category: '',
      organizer: '',
      capacity: '',
      start_time: '',
      end_time: ''
    })

  const [imageFile, setImageFile] =
    useState(null)

  const [imagePreview, setImagePreview] =
    useState(null)

  const [scheduleItems, setScheduleItems] = useState([])

  const [editingEvent, setEditingEvent] =
    useState(null)

  const [editSessions, setEditSessions] = useState([])

  const [editFormData, setEditFormData] =
    useState({
      title: '',
      description: '',
      category: '',
      organizer: '',
      capacity: '',
      start_time: '',
      end_time: '',
      date: '',
      venue: ''
    })

  const [editImageFile, setEditImageFile] =
    useState(null)

  const [editImagePreview, setEditImagePreview] =
    useState(null)

  const [venues, setVenues] = useState([])

  const [availability, setAvailability] =
    useState([])

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false)

  // Availability does not need another round trip when a coordinator returns
  // to a date they have already inspected during this dashboard session.
  const availabilityCache = useRef(new Map())

  const visibleYear =
    visibleMonth.getFullYear()

  const visibleMonthIndex =
    visibleMonth.getMonth()

  const monthLabel =
    visibleMonth.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric'
      }
    )

  const selectedDateObject =
    new Date(
      visibleYear,
      visibleMonthIndex,
      selectedDate
    )

  const selectedDateValue =
    `${selectedDateObject.getFullYear()}-${String(
      selectedDateObject.getMonth() + 1
    ).padStart(2, '0')}-${String(
      selectedDateObject.getDate()
    ).padStart(2, '0')}`

  const firstWeekdayOffset =
    (
      new Date(
        visibleYear,
        visibleMonthIndex,
        1
      ).getDay() + 6
    ) % 7

  const daysInMonth =
    new Date(
      visibleYear,
      visibleMonthIndex + 1,
      0
    ).getDate()

  const days =
    Array.from(
      { length: daysInMonth },
      (_, i) => i + 1
    )

  const goToPreviousMonth = () => {

    setVisibleMonth(
      new Date(
        visibleYear,
        visibleMonthIndex - 1,
        1
      )
    )
    setSelectedDate(1)

  }

  const goToNextMonth = () => {

    setVisibleMonth(
      new Date(
        visibleYear,
        visibleMonthIndex + 1,
        1
      )
    )
    setSelectedDate(1)

  }

  const goToToday = () => {

    const currentDate = new Date()

    setVisibleMonth(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
    )
    setSelectedDate(currentDate.getDate())

  }

  useEffect(() => {

    const fetchEvents = async () => {

      try {
        const response =
          await api.get('/events/manage')

        setMyEvents(response.data)
      }
      catch {
        setFormError('Unable to load your event requests')
      }

    }

    fetchEvents()

  }, [])

  useEffect(() => {

    const fetchVenues = async () => {

      try {
        const response =
          await api.get('/venues')

        if (response.data.length) {
          const venueNames = response.data.map(venue => venue.name)
          setVenues(venueNames)
          setSelectedVenue((currentVenue) => currentVenue || venueNames[0])
        } else {
          setSelectedVenue('')
          setFormError('No venues are available. Ask an admin to add one first.')
        }
      }
      catch {
        setFormError('Unable to load venues')
      }

    }

    fetchVenues()

  }, [])

  useEffect(() => {

    // A create/edit can change bookings. Clear cached dates before fetching
    // again so the next calendar view always represents the latest data.
    availabilityCache.current.clear()

  }, [myEvents])

  useEffect(() => {

    let stillCurrent = true

    const fetchAvailability = async () => {

      const cachedAvailability =
        availabilityCache.current.get(selectedDateValue)

      if (cachedAvailability) {
        setAvailability(cachedAvailability)
        setAvailabilityLoading(false)
        return
      }

      setAvailability([])
      setAvailabilityLoading(true)

      try {
        const response = await api.get(
          `/events/availability?date=${selectedDateValue}`
        )

        availabilityCache.current.set(
          selectedDateValue,
          response.data
        )

        if (stillCurrent) {
          setAvailability(response.data)
        }
      }
      catch {
        if (stillCurrent) {
          setAvailability([])
        }
      }
      finally {
        if (stillCurrent) {
          setAvailabilityLoading(false)
        }
      }

    }

    fetchAvailability()

    return () => {
      // Do not let a slower request for the previously selected date replace
      // the data shown for a newer selection.
      stillCurrent = false
    }

  }, [selectedDateValue, myEvents])

  const handleFormChange = (e) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

  }

  const openCreateForm = () => {
    setFormError('')
    setScheduleItems([{
      venue: selectedVenue,
      date: selectedDateValue,
      start_time: '',
      end_time: ''
    }])
    setShowCreateForm(true)
  }

  const updateScheduleItem = (index, field, value) => {
    setScheduleItems(items => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )))
  }

  const addScheduleItem = () => {
    setScheduleItems(items => [...items, {
      venue: selectedVenue,
      date: selectedDateValue,
      start_time: '',
      end_time: ''
    }])
  }

  const removeScheduleItem = (index) => {
    setScheduleItems(items => items.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleCreateEvent = async (e) => {

    e.preventDefault()
    setFormError('')

    try {
      const response = await api.post(
        '/events',
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          sessions: scheduleItems,
          organizer: formData.organizer,
          capacity: Number(formData.capacity)
        }
      )

      let createdEvent = response.data
      let uploadError = ''

      if (imageFile) {
        try {
          const uploadForm = new FormData()
          uploadForm.append('file', imageFile)
          const uploadRes = await api.post(
            `/events/${createdEvent.id}/image`,
            uploadForm,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          )
          createdEvent = uploadRes.data
        }
        catch (error) {
          uploadError = error.response?.data?.detail || 'The cover image could not be uploaded.'
        }
      }

      setMyEvents((currentEvents) => [
        createdEvent,
        ...currentEvents
      ])

      setFormData({
        title: '',
        description: '',
        category: '',
        organizer: '',
        capacity: '',
        start_time: '',
        end_time: ''
      })
      setImageFile(null)
      setImagePreview(null)
      setScheduleItems([])

      if (uploadError) {
        setFormError(
          `Event request submitted, but its cover image was not uploaded: ${uploadError} You can add it later by editing the event.`
        )
      }
      else {
        setShowCreateForm(false)
        setActiveTab('events')
      }
    }
    catch (error) {
      setFormError(
        error.response?.data?.detail ||
        'Unable to submit event request'
      )
    }

  }

  const startEditingEvent = (event) => {

    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || '',
      organizer: event.organizer || '',
      capacity: event.capacity != null
        ? String(event.capacity)
        : '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      date: event.date || '',
      venue: event.venue || ''
    })

    setEditImageFile(null)
    setEditImagePreview(event.image || null)
    setEditSessions(event.sessions?.length ? event.sessions.map(({ venue, date, start_time, end_time }) => ({ venue, date, start_time, end_time })) : [{
      venue: event.venue || '', date: event.date || '',
      start_time: event.start_time || '', end_time: event.end_time || ''
    }])

    setEditingEvent(event)

  }

  const closeEditingEvent = () => {

    setEditingEvent(null)
    setEditFormData({})
    setEditImageFile(null)
    setEditImagePreview(null)
    setEditSessions([])

  }

  const handleEditChange = (e) => {

    const { name, value } = e.target

    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }))

  }

  const updateEditSession = (index, field, value) => {
    setEditSessions(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  const addEditSession = () => {
    setEditSessions(items => [...items, { venue: venues[0] || '', date: selectedDateValue, start_time: '', end_time: '' }])
  }

  const removeEditSession = (index) => {
    setEditSessions(items => items.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleUpdateEvent = async (e) => {

    e.preventDefault()
    setFormError('')

    try {
      const response = await api.patch(
        `/events/${editingEvent.id}`,
        {
          title: editFormData.title,
          description: editFormData.description,
          category: editFormData.category,
          sessions: editSessions,
          organizer: editFormData.organizer,
          capacity: Number(editFormData.capacity)
        }
      )

      let updatedEvent = response.data

      if (editImageFile) {
        const uploadForm = new FormData()
        uploadForm.append('file', editImageFile)
        const uploadRes = await api.post(
          `/events/${updatedEvent.id}/image`,
          uploadForm,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        updatedEvent = uploadRes.data
      }

      setMyEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === updatedEvent.id
            ? updatedEvent
            : event
        )
      )

      closeEditingEvent()
      setFormError('')
    }
    catch {
      setFormError('Unable to update event')
    }

  }

  const handleDownloadLetter = async (event) => {
    setFormError('')
    try {
      const response = await api.get(
        `/events/${event.id}/permission-letter`,
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event.title}-permission-letter.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }
    catch (error) {
      setFormError(
        error.response?.data?.detail ||
        'Unable to download the permission letter'
      )
    }
  }

  const selectedVenueAvailability =
    availability.find(
      item =>
        item.venue === selectedVenue
    )

  const selectedDateLoad =
    availability.reduce(
      (total, item) =>
        total + item.load,
      0
    ) / Math.max(availability.length, 1)

  const selectedDateStatus =
    selectedVenueAvailability?.bookings?.length
      ? 'pending'
      : 'available'

  const getDayLoad = (day) => {

    const dateObject =
      new Date(
        visibleYear,
        visibleMonthIndex,
        day
      )

    const date = `${dateObject.getFullYear()}-${String(
      dateObject.getMonth() + 1
    ).padStart(2, '0')}-${String(
      dateObject.getDate()
    ).padStart(2, '0')}`
    const dayEvents =
      myEvents.filter(
        event =>
          event.date === date &&
          ['pending', 'approved'].includes(
            event.status
          )
      )

    return Math.min(dayEvents.length / 4, 1)

  }
  return (

    <div className="coordinator-container">

      {/* NAVBAR */}

      <nav className="coordinator-nav">

        <div className="nav-content">

          <Link
            to="/"
            className="logo"
          >
            NEXUS.
          </Link>

          <div className="dashboard-title">

            <p>
              EVENT OPERATIONS CENTER
            </p>

          </div>

          <div className="nav-actions">

            <NotificationBell />

            <Link
              className="user-menu"
              to="/profile"
            >
              {
                sessionStorage.getItem(
                  'userName'
                ) || 'Coordinator'
              }
            </Link>

            <button
              className="signout-btn"
              onClick={() =>
                signOut(navigate)
              }
              title="Sign out"
            >
              <LogOut size={16} />
              Sign out
            </button>

          </div>

        </div>

      </nav>

      {/* MAIN */}

      <div className="coordinator-content">

        {/* SIDEBAR */}

        <aside
          className="coordinator-sidebar"
        >

          <button
            className={`nav-tab ${
              activeTab === 'calendar'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'calendar'
              )
            }
          >
            <Calendar size={18}/>
            Calendar
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'events'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'events'
              )
            }
          >
            <FileText size={18}/>
            My Events
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'analytics'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'analytics'
              )
            }
          >
            <BarChart3 size={18}/>
            Analytics
          </button>

        </aside>

        {/* MAIN PANEL */}

        <main className="coordinator-main">

          {activeTab === 'calendar' && (

            <section
              className="calendar-section"
            >

              <div
                className="calendar-header"
              >

                <div>

                  <h1>
                    Shared Venue Calendar
                  </h1>

                  <p>
                    Check availability
                    before submitting an
                    event request.
                  </p>

                </div>

                <select
                  value={selectedVenue}
                  onChange={(e) =>
                    setSelectedVenue(
                      e.target.value
                    )
                  }
                  className="venue-selector"
                >

                  {venues.map(
                    venue => (

                      <option
                        key={venue}
                        value={venue}
                      >
                        {venue}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div
                className="calendar-layout"
              >

                {/* CALENDAR */}

                <div
                  className="calendar-card"
                >

                  <div className="calendar-month-header">

                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                    >
                      ‹
                    </button>

                    <div>

                      <h2>
                        {monthLabel}
                      </h2>

                      <span>
                        Selected:
                        {' '}
                        {selectedDateObject.toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }
                        )}
                      </span>

                    </div>

                    <div className="calendar-month-actions">

                      <button
                        type="button"
                        onClick={goToToday}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={goToNextMonth}
                      >
                        ›
                      </button>

                    </div>

                  </div>

                  <div
                    className="weekdays"
                  >

                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>

                  </div>

                  <div
                    className="calendar-grid"
                  >

                    {days.map(day => {

                      const load = getDayLoad(day)
                      const isToday =
                        visibleYear === today.getFullYear() &&
                        visibleMonthIndex === today.getMonth() &&
                        day === today.getDate()
                      const isSelected =
                        day === selectedDate

                      return (

                        <React.Fragment key={day}>

                        {day === 1 &&
                          Array.from(
                            {
                              length: firstWeekdayOffset
                            },
                            (_, index) => (
                              <div
                                key={`blank-${index}`}
                                className="calendar-empty"
                              />
                            )
                          )}

                        <motion.div

                          whileHover={{
                            scale: 1.05
                          }}

                          className={`calendar-day ${
                            isToday ? 'today' : ''
                          } ${
                            isSelected ? 'selected' : ''
                          }`}
                          style={{
                            background:
                              load > 0
                                ? `rgba(255, 49, 49, ${0.18 + load * 0.62})`
                                : undefined
                          }}

                          onClick={() =>
                            setSelectedDate(
                              day
                            )
                          }
                        >

                          {day}

                        </motion.div>

                        </React.Fragment>

                      )

                    })}

                  </div>

                  <div
                    className="calendar-legend"
                  >

                    <span>
                      Light red: lightly booked
                    </span>

                    <span>
                      Dark red: heavily booked
                    </span>

                    <span>
                      Click a date to inspect venues
                    </span>

                  </div>

                </div>

                {/* DETAILS */}

                <div
                  className="date-panel"
                >

                  <h3>
                    Selected Date
                  </h3>

                  <h2>
                    {selectedDateObject.toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }
                    )}
                  </h2>

                  {availabilityLoading && (
                    <p className="availability-loading">
                      Updating venue availability…
                    </p>
                  )}

                  <div className="venue-availability-list">

                    {availability.map(item => (

                      <button
                        key={item.venue}
                        type="button"
                        className={`venue-slot-card ${
                          selectedVenue === item.venue
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedVenue(item.venue)
                        }
                      >

                        <div>
                          <strong>
                            {item.venue}
                          </strong>

                          <span>
                            Capacity {item.capacity}
                          </span>
                        </div>

                        <div
                          className="venue-load-bar"
                        >
                          <span
                            style={{
                              width: `${item.load * 100}%`
                            }}
                          />
                        </div>

                        {item.bookings.length ? (
                          <div className="booking-list">
                            {item.bookings.map(booking => (
                              <small key={booking.event_id}>
                                {booking.start_time} - {booking.end_time}
                                {' '}
                                {booking.title}
                              </small>
                            ))}
                          </div>
                        ) : (
                          <small>
                            Available all day
                          </small>
                        )}

                      </button>

                    ))}

                  </div>

                  <div
  className={`status-card ${selectedDateStatus}`}
>

  <h4>
    Availability
  </h4>

  <p>

    {selectedDateStatus === 'available' &&
      `Average load ${Math.round(selectedDateLoad * 100)}%. Selected venue is free so far.`}

    {selectedDateStatus === 'pending' &&
      `Average load ${Math.round(selectedDateLoad * 100)}%. Check booked slots before choosing time.`}

  </p>

</div>

                  <button
  className="btn-create"
  onClick={() => showCreateForm ? setShowCreateForm(false) : openCreateForm()}
>

  Create Event Request

</button>

                </div>

              </div>

              {showCreateForm && (

                <form
                  className="event-request-form"
                  onSubmit={handleCreateEvent}
                >

                  <h2>
                    New Event Request
                  </h2>

                  {formError && (
                    <p className="form-error">
                      {formError}
                    </p>
                  )}

                  <div className="form-grid">

                    <input
                      name="title"
                      placeholder="Event title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="category"
                      placeholder="Category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="organizer"
                      placeholder="Club / organizer"
                      value={formData.organizer}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      placeholder="Capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      required
                    />

                    {imagePreview && (
                      <div className="image-upload-preview">
                        <img
                          src={imagePreview}
                          alt="Event image preview"
                        />
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <label className="image-upload-box">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setImageFile(file)
                            setImagePreview(
                              URL.createObjectURL(file)
                            )
                          }
                        }}
                      />
                      {imageFile
                        ? imageFile.name
                        : 'Upload event image (optional)'}
                    </label>

                  </div>

                  <section className="event-schedule-builder">
                    <div className="schedule-builder-heading">
                      <div>
                        <span>EVENT SCHEDULE</span>
                        <h3>Dates, times and venues</h3>
                        <p>Add every venue slot needed for this single event request.</p>
                      </div>
                      <button type="button" className="schedule-add-button" onClick={addScheduleItem}>
                        + Add another slot
                      </button>
                    </div>

                    {scheduleItems.map((item, index) => (
                      <div className="schedule-item" key={`${item.date}-${item.venue}-${index}`}>
                        <strong>Slot {index + 1}</strong>
                        <label>
                          <span>Date</span>
                          <input type="date" value={item.date} required onChange={(e) => updateScheduleItem(index, 'date', e.target.value)} />
                        </label>
                        <label>
                          <span>Venue</span>
                          <select value={item.venue} required onChange={(e) => updateScheduleItem(index, 'venue', e.target.value)}>
                            <option value="" disabled>Select venue</option>
                            {venues.map(venue => <option key={venue} value={venue}>{venue}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Starts at</span>
                          <input type="time" value={item.start_time} required onChange={(e) => updateScheduleItem(index, 'start_time', e.target.value)} />
                        </label>
                        <label>
                          <span>Ends at</span>
                          <input type="time" value={item.end_time} required onChange={(e) => updateScheduleItem(index, 'end_time', e.target.value)} />
                        </label>
                        {scheduleItems.length > 1 && (
                          <button type="button" className="schedule-remove-button" onClick={() => removeScheduleItem(index)} aria-label={`Remove schedule slot ${index + 1}`}>×</button>
                        )}
                      </div>
                    ))}
                  </section>

                  <textarea
                    name="description"
                    placeholder="Event description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                  />

                  <button
                    className="btn-create"
                    type="submit"
                  >
                    Submit for Approval
                  </button>

                </form>

              )}

            </section>

          )}
          {activeTab === 'events' && (

            <section className="events-section">

              <div className="events-header">

                <h1>
                  My Events
                </h1>

                <p>
                  Track approvals,
                  registrations and
                  permission letters.
                </p>

              </div>

              {editingEvent && (

                <form
                  className="event-edit-form"
                  onSubmit={handleUpdateEvent}
                >

                  <div className="edit-form-header">

                    <h2>
                      Edit Event
                    </h2>

                    <button
                      type="button"
                      className="close-edit-btn"
                      onClick={closeEditingEvent}
                    >
                      Cancel
                    </button>

                  </div>

                  {formError && (
                    <p className="form-error">
                      {formError}
                    </p>
                  )}

                  <div className="form-grid">

                    <input
                      name="title"
                      placeholder="Event title"
                      value={editFormData.title}
                      onChange={handleEditChange}
                      required
                    />

                    <input
                      name="category"
                      placeholder="Category"
                      value={editFormData.category}
                      onChange={handleEditChange}
                      required
                    />

                    <input
                      name="organizer"
                      placeholder="Club / organizer"
                      value={editFormData.organizer}
                      onChange={handleEditChange}
                      required
                    />

                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      placeholder="Capacity"
                      value={editFormData.capacity}
                      onChange={handleEditChange}
                      required
                    />

                    {editImagePreview && (
                      <div className="image-upload-preview">
                        <img
                          src={editImagePreview}
                          alt="Event image preview"
                        />
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={() => {
                            setEditImageFile(null)
                            setEditImagePreview(null)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <label className="image-upload-box">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setEditImageFile(file)
                            setEditImagePreview(
                              URL.createObjectURL(file)
                            )
                          }
                        }}
                      />
                      {editImageFile
                        ? editImageFile.name
                        : 'Upload new image (optional)'}
                    </label>

                  </div>

                  <section className="event-schedule-builder">
                    <div className="schedule-builder-heading">
                      <div>
                        <span>EVENT SCHEDULE</span>
                        <h3>Dates, times and venues</h3>
                        <p>Edit all venue slots under this one event request.</p>
                      </div>
                      <button type="button" className="schedule-add-button" onClick={addEditSession}>+ Add another slot</button>
                    </div>
                    {editSessions.map((item, index) => (
                      <div className="schedule-item" key={`${item.date}-${item.venue}-${index}`}>
                        <strong>Slot {index + 1}</strong>
                        <label><span>Date</span><input type="date" value={item.date} required onChange={(e) => updateEditSession(index, 'date', e.target.value)} /></label>
                        <label><span>Venue</span><select value={item.venue} required onChange={(e) => updateEditSession(index, 'venue', e.target.value)}><option value="" disabled>Select venue</option>{venues.map(venue => <option key={venue} value={venue}>{venue}</option>)}</select></label>
                        <label><span>Starts at</span><input type="time" value={item.start_time} required onChange={(e) => updateEditSession(index, 'start_time', e.target.value)} /></label>
                        <label><span>Ends at</span><input type="time" value={item.end_time} required onChange={(e) => updateEditSession(index, 'end_time', e.target.value)} /></label>
                        {editSessions.length > 1 && <button type="button" className="schedule-remove-button" onClick={() => removeEditSession(index)} aria-label={`Remove schedule slot ${index + 1}`}>×</button>}
                      </div>
                    ))}
                  </section>

                  <textarea
                    name="description"
                    placeholder="Event description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    required
                  />

                  <button
                    className="btn-create"
                    type="submit"
                  >
                    Save Changes
                  </button>

                </form>

              )}

              <div className="event-cards">

                {formError && (
                  <p className="form-error">
                    {formError}
                  </p>
                )}

                {myEvents.map(event => (

                  <div
                    key={event.id}
                    className="event-link"
                  >

                 <motion.div
                  className="event-card"
                 >
                    <div className="event-top">

                      <div>

                        <h2>
                          {event.title}
                        </h2>

                        <p>
                          {event.venue}
                          {event.start_time &&
                            event.end_time &&
                            ` • ${event.start_time}-${event.end_time}`}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${event.status}`}
                      >
                        {event.status}
                      </span>

                    </div>

                    {/* Workflow */}

                    <div className="workflow">

                      <div className="workflow-step done">
                        Submitted
                      </div>

                      <div className="workflow-step done">
                        Review
                      </div>

                      <div
                        className={`workflow-step ${
                          event.status === 'approved'
                            ? 'done'
                            : 'active'
                        }`}
                      >
                        Approval
                      </div>

                      <div
                        className={`workflow-step ${
                          event.status === 'approved'
                            ? 'done'
                            : ''
                        }`}
                      >
                        Letter
                      </div>

                    </div>

                    {/* Registration */}

                    <div className="registration-card">

                      <div className="registration-header">

                        <span>
                          Registrations
                        </span>

                        <span>
                          {event.attendees}/
                          {event.capacity}
                        </span>

                      </div>

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (event.attendees /
                                event.capacity) *
                              100
                            }%`
                          }}
                        />

                      </div>

                    </div>

                    <Link
                      to={`/events/${event.id}/attendees`}
                      className="attendees-toggle"
                    >
                      View attendee list
                    </Link>

                    <Link
                      to={`/events/${event.id}`}
                      className="details-link"
                    >
                      View details
                    </Link>

                    <button
                      type="button"
                      className="edit-event-btn"
                      onClick={() =>
                        startEditingEvent(event)
                      }
                    >
                      Edit event
                    </button>

                    {/* Permission Letter */}

                    {event.status === 'approved' && (

                      <div className="permission-card">

                        <div>

                          <h4>
                            Permission Letter
                          </h4>

                          <p>
                            Generated &
                            Ready
                          </p>

                        </div>

                        <button
                          type="button"
                          className="download-btn"
                          onClick={() => handleDownloadLetter(event)}
                        >

                          <Download
                            size={16}
                          />

                          Download

                        </button>

                      </div>

                    )}

                  </motion.div>
                  </div>

                ))}

              </div>

            </section>

          )}

          {activeTab === 'analytics' && (

            <section className="analytics-section">

              <div className="analytics-header">

                <h1>
                  Analytics
                </h1>

                <p>
                  Overview of your
                  event performance.
                </p>

              </div>

              <div className="analytics-grid">

                <div className="analytics-card">

                  <FileText
                    size={26}
                  />

                  <h3>
                    Total Events
                  </h3>

                  <h2>
                    {myEvents.length}
                  </h2>

                </div>

                <div className="analytics-card">

                  <Users
                    size={26}
                  />

                  <h3>
                    Total Registrations
                  </h3>

                  <h2>

                    {
                      myEvents.reduce(
                        (
                          total,
                          event
                        ) =>
                          total +
                          event.attendees,
                        0
                      )
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <Calendar
                    size={26}
                  />

                  <h3>
                    Pending Requests
                  </h3>

                  <h2>

                    {
                      myEvents.filter(
                        e =>
                          e.status ===
                          'pending'
                      ).length
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <BarChart3
                    size={26}
                  />

                  <h3>
                    Approval Rate
                  </h3>

                  <h2>
                    87%
                  </h2>

                </div>

              </div>

            </section>

          )}

        </main>

      </div>

    </div>

  )

}
 export default CoordinatorDashboard
