import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student'
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    if (formData.email && formData.password) {
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userName', formData.name || 'User')
      localStorage.setItem('userRole', formData.role)
      navigate('/dashboard/student')
    }
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.password) {
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userName', formData.name)
      localStorage.setItem('userRole', formData.role)
      navigate('/dashboard/student')
    }
  }

  return (
    <div className="login-container">
      <motion.div 
        className="login-box"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="login-header">
          <Link to="/" className="login-logo">NEXUS.</Link>
          <h1>Campus Events</h1>
          <p>Sign in or create an account</p>
        </div>

        <div className="login-tabs">
          <button 
            className={`login-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`login-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {activeTab === 'signin' && (
          <motion.form 
            className="login-form"
            onSubmit={handleSignIn}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn-submit">Sign In</button>

            <div className="form-footer">
              <p>Don't have an account? <button type="button" onClick={() => setActiveTab('signup')} className="link">Sign up here</button></p>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>
          </motion.form>
        )}

        {activeTab === 'signup' && (
          <motion.form 
            className="login-form"
            onSubmit={handleSignUp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>I am a:</label>
              <select name="role" value={formData.role} onChange={handleInputChange}>
                <option value="student">Student</option>
                <option value="coordinator">Event Coordinator</option>
                <option value="approver">Approver</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button type="submit" className="btn-submit">Create Account</button>

            <div className="form-footer">
              <p>Already have an account? <button type="button" onClick={() => setActiveTab('signin')} className="link">Sign in here</button></p>
            </div>
          </motion.form>
        )}
      </motion.div>

      <div className="login-background">
        <div className="bg-circle bg-1"></div>
        <div className="bg-circle bg-2"></div>
        <div className="bg-circle bg-3"></div>
      </div>
    </div>
  )
}

export default Login