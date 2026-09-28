import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import CoordinatorDashboard from './pages/CoordinatorDashboard'
import ApproverDashboard from './pages/ApproverDashboard'
import AdminDashboard from './pages/AdminDashboard'
import EventDetails from './pages/EventDetails'
import UserProfile from './pages/UserProfile'
import PastEvents from './pages/PastEvents'
import EventsPage from './pages/EventsPage'
import EventAttendees from './pages/EventAttendees'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import './index.css'

function WatermarkPage({ children }) {
  return (
    <div className="campus-watermark">
      {children}
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<WatermarkPage><Login /></WatermarkPage>} />
        <Route path="/forgot-password" element={<WatermarkPage><ForgotPassword /></WatermarkPage>} />
        <Route path="/reset-password" element={<WatermarkPage><ResetPassword /></WatermarkPage>} />
        <Route path="/dashboard/student" element={<WatermarkPage><StudentDashboard /></WatermarkPage>} />
        <Route path="/dashboard/coordinator" element={<WatermarkPage><CoordinatorDashboard /></WatermarkPage>} />
        <Route path="/dashboard/approver" element={<WatermarkPage><ApproverDashboard /></WatermarkPage>} />
        <Route path="/dashboard/admin" element={<WatermarkPage><AdminDashboard /></WatermarkPage>} />
        <Route path="/events/:id" element={<WatermarkPage><EventDetails /></WatermarkPage>} />
        <Route path="/profile" element={<WatermarkPage><UserProfile /></WatermarkPage>} />
        <Route path="/events/past" element={<WatermarkPage><PastEvents /></WatermarkPage>} />
        <Route path="/events" element={<WatermarkPage><EventsPage /></WatermarkPage>} />
        <Route path="/events/:id/attendees" element={<WatermarkPage><EventAttendees /></WatermarkPage>} />
      </Routes>
    </Router>
  )
}

export default App
