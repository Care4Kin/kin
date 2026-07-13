import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first school?',
]

export default function Register() {
  const [form, setForm] = useState({
    phone: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'elder',
    security_question: SECURITY_QUESTIONS[0],
    security_answer: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        phone: form.phone,
        security_question: form.security_question,
        security_answer: form.security_answer,
      })
      const data = await api.login({ email: form.email, password: form.password })
      login({ user_id: data.user_id, role: data.role, full_name: data.full_name }, data.token)
      navigate('/', { state: { justSignedUp: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleCredential(idToken) {
    setError('')
    try {
      const data = await api.googleAuth(idToken)
      if (data.needs_setup) {
        navigate('/complete-signup', { state: { idToken, fullName: data.full_name } })
        return
      }
      // Email already had an account — just log them in.
      login({ user_id: data.user_id, role: data.role, full_name: data.full_name }, data.token)
      navigate('/', { state: { justSignedUp: true } })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign Up</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="confirm_password">Re-enter Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="role">I am a…</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="elder">Older Adult</option>
              <option value="caregiver">Family Member / Caregiver</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="security_question">Security Question</label>
            <p className="field-hint">Used to reset your password if you forget it — no email or phone needed.</p>
            <select
              id="security_question"
              name="security_question"
              value={form.security_question}
              onChange={handleChange}
            >
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="security_answer">Your Answer</label>
            <input
              id="security_answer"
              name="security_answer"
              type="text"
              value={form.security_answer}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <GoogleSignInButton role={form.role} onCredential={handleGoogleCredential} onError={setError} />

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  )
}
