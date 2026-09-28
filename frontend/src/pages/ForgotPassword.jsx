import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch {
      setError('We could not process that request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="recovery-page">
      <section className="recovery-card">
        <Link className="login-logo" to="/">NEXUS.</Link>
        <p className="recovery-kicker">ACCOUNT RECOVERY</p>
        <h1>Reset your password</h1>
        {submitted ? (
          <div className="recovery-success">
            <p>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
            <p>Check your inbox and spam folder. The link expires in 15 minutes.</p>
            <Link className="recovery-back" to="/login">Back to sign in</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <p className="recovery-copy">Enter the email address associated with your NEXUS account.</p>
            <div className="form-group">
              <label htmlFor="recovery-email">Email address</label>
              <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@college.edu" required />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Sending link…' : 'Send reset link'}</button>
            <Link className="recovery-back" to="/login">Back to sign in</Link>
          </form>
        )}
      </section>
    </main>
  )
}
