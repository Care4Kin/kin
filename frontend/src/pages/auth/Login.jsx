import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import FormMessage from '../../components/FormMessage'

export default function Login() {
  const [mode, setMode] = useState('email') // 'email' | 'phone' | 'question'
  const [form, setForm] = useState({ email: '', password: '' })
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [questionEmail, setQuestionEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [questionFetched, setQuestionFetched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function finishLogin(data) {
    login({ user_id: data.user_id, role: data.role, full_name: data.full_name, email: data.email }, data.token)
    navigate('/dashboard')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      finishLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendCode(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.sendPhoneCode(phone)
      setCodeSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.verifyPhoneCode(phone, code)
      finishLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFetchQuestion(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.getSecurityQuestion(questionEmail)
      setQuestion(data.security_question)
      setQuestionFetched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuestionLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.loginWithSecurityQuestion({ email: questionEmail, security_answer: questionAnswer })
      finishLogin(data)
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
      finishLogin(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Log In</h1>

        <div className="auth-mode-toggle">
          <button type="button" className={mode === 'email' ? 'active' : ''} onClick={() => { setMode('email'); setError('') }}>
            Email
          </button>
          <button type="button" className={mode === 'phone' ? 'active' : ''} onClick={() => { setMode('phone'); setError('') }}>
            Phone
          </button>
          <button type="button" className={mode === 'question' ? 'active' : ''} onClick={() => { setMode('question'); setError('') }}>
            Security Question
          </button>
        </div>

        {mode === 'email' ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
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
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <FormMessage variant="error">{error}</FormMessage>

            <Link to="/forgot-password" className="forgot-link">
              Forgot my password
            </Link>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        ) : mode === 'phone' ? (
          !codeSent ? (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="field-group">
              <label htmlFor="phone">Phone Number</label>
              <p className="field-hint">We'll text you a code to confirm it's you — no password needed.</p>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>

            <FormMessage variant="error">{error}</FormMessage>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="field-group">
              <label htmlFor="code">Enter the Code</label>
              <p className="field-hint">Did you get a text in the last 5 minutes? Type the code here.</p>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>

            <FormMessage variant="error">{error}</FormMessage>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking…' : 'Log In'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setCodeSent(false); setCode(''); setPhone(''); setError('') }}>
              Use a different number
            </button>
          </form>
          )
        ) : !questionFetched ? (
          <form onSubmit={handleFetchQuestion} className="auth-form">
            <div className="field-group">
              <label htmlFor="question-email">Email</label>
              <p className="field-hint">We'll show your security question — no password needed.</p>
              <input
                id="question-email"
                name="question-email"
                type="email"
                autoComplete="username"
                value={questionEmail}
                onChange={e => setQuestionEmail(e.target.value)}
                required
              />
            </div>

            <FormMessage variant="error">{error}</FormMessage>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Looking up…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleQuestionLogin} className="auth-form">
            <div className="field-group">
              <span className="field-group-label">Security Question</span>
              <p className="field-hint">{question}</p>
            </div>

            <div className="field-group">
              <label htmlFor="question-answer">Your Answer</label>
              <input
                id="question-answer"
                name="question-answer"
                type="text"
                value={questionAnswer}
                onChange={e => setQuestionAnswer(e.target.value)}
                required
              />
            </div>

            <FormMessage variant="error">{error}</FormMessage>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking…' : 'Log In'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setQuestionFetched(false); setQuestionAnswer(''); setQuestionEmail(''); setError('') }}>
              Use a different email
            </button>
          </form>
        )}

        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </main>
  )
}
