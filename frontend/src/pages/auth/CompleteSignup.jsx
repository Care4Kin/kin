import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import FormMessage from '../../components/FormMessage'
import RolePicker from '../../components/RolePicker'

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first school?',
]

export default function CompleteSignup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const idToken = location.state?.idToken
  const fullName = location.state?.fullName

  const [role, setRole] = useState('elder')
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reached directly without coming from a Google sign-in — nothing to finish.
  if (!idToken) return <Navigate to="/register" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.googleComplete({
        id_token: idToken,
        role,
        security_question: securityAnswer.trim() ? securityQuestion : null,
        security_answer: securityAnswer.trim() || null,
      })
      login({ user_id: data.user_id, role: data.role, full_name: data.full_name }, data.token)
      navigate('/dashboard', { state: { justSignedUp: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Finish Setting Up</h1>
        <p className="field-hint mb-md">
          {fullName ? `Welcome, ${fullName.split(' ')[0]}! ` : ''}
          Just a couple of things so we can set up your circle.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <RolePicker value={role} onChange={setRole} />

          <div className="field-group">
            <label htmlFor="security_question">Security Question (optional)</label>
            <p className="field-hint">Lets you reset a password later if you ever sign in without Google.</p>
            <select id="security_question" value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)}>
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="security_answer">Your Answer (optional)</label>
            <input id="security_answer" type="text" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} />
          </div>

          <FormMessage variant="error">{error}</FormMessage>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Setting up…' : 'Finish'}
          </button>
        </form>
      </div>
    </main>
  )
}
