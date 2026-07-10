import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

export default function ForgotPassword() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.getSecurityQuestion(email)
      setQuestion(data.security_question)
      setStep('answer')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword({ email, security_answer: answer, new_password: newPassword })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>

        {done ? (
          <>
            <p className="field-hint">Your password has been updated. You can log in now.</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>Go to Log In</button>
          </>
        ) : step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Looking up…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="auth-form">
            <div className="field-group">
              <label>Security Question</label>
              <p className="field-hint">{question}</p>
            </div>

            <div className="field-group">
              <label htmlFor="answer">Your Answer</label>
              <input
                id="answer"
                name="answer"
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="confirm_password">Re-enter New Password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remembered it after all?{' '}
          <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  )
}
