import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css';

function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('signin')
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [userRole, setUserRole] = useState('student')

  const handleSignIn = (e) => {
    e.preventDefault()
    navigate('/dashboard/student')
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    if (userRole === 'student') {
      navigate('/dashboard/student')
    } else if (userRole === 'coordinator') {
      navigate('/dashboard/coordinator')
    } 
    else if (userRole ==='approver') {
      navigate('/dashboard/approver')
    }
    
    else {
      navigate('/dashboard/admin')
    }
  }

  return (
    <div className="login-container">
      {/* Back to home */}
      <div className="login-header">
        <Link to="/" className="logo">NEXUS</Link>
      </div>

      {/* Main Card */}
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Tabs */}
        <div className="login-tabs">
          <button 
            className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        {activeTab === 'signin' && (
          <motion.form
            className="login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSignIn}
          >
            <div className="form-group">
              <label htmlFor="signin-email">Email</label>
              <input
                id="signin-email"
                type="email"
                placeholder="your@email.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signin-password">Password</label>
              <input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-submit">Sign In</button>
            
            <p className="form-help">
              Don't have an account? <a href="#" onClick={() => setActiveTab('signup')}>Sign up</a>
            </p>
          </motion.form>
        )}

        {/* Sign Up Form */}
        {activeTab === 'signup' && (
          <motion.form
            className="login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSignUp}
          >
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-role">I am a</label>
              <select
                id="user-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="coordinator">Event Coordinator</option>
                <option value="admin">Admin</option>
                <option value="approver">Approver</option>
              </select>
            </div>

            <button type="submit" className="btn-submit">Sign Up</button>
            
            <p className="form-help">
              Already have an account? <a href="#" onClick={() => setActiveTab('signin')}>Sign in</a>
            </p>
          </motion.form>
        )}
      </motion.div>
    </div>
  )
}

export default Login