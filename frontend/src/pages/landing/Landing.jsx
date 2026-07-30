import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DollarSign, Repeat, Pill, Landmark, Calendar, Flag, FileText, Users, ShieldCheck, Lock, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import KinLogo from '../../components/KinLogo'
import FormMessage from '../../components/FormMessage'

const FEATURES = [
  { icon: DollarSign, label: 'Bills', desc: "Track what you owe and when it's due", href: '/bills' },
  { icon: Repeat, label: 'Subscriptions', desc: 'Review your monthly services', href: '/subscriptions' },
  { icon: Pill, label: 'Prescriptions', desc: 'See upcoming refill dates', href: '/prescriptions' },
  { icon: Landmark, label: 'Important Accounts', desc: 'Bank, insurance, healthcare and more', href: '/accounts' },
  { icon: Calendar, label: 'Appointments', desc: 'Upcoming visits and reminders', href: '/appointments' },
  { icon: Flag, label: 'Suspicious Activity', desc: 'Flag a scam call, email, or bill', href: '/flags' },
  { icon: FileText, label: 'Shared Notes', desc: 'Leave a message for your family', href: '/notes' },
  { icon: Users, label: 'Family Circle', desc: "See who's helping and manage access", href: '/circle' },
]

const STEPS = [
  { n: 1, title: 'Create your circle', desc: 'Invite the family members you trust to help.' },
  { n: 2, title: 'Add what matters', desc: 'Bills, prescriptions, accounts, and appointments — all in one place.' },
  { n: 3, title: 'Family helps, you stay in control', desc: 'You choose who sees what, and can change it anytime.' },
]

const TRUST = [
  { icon: ShieldCheck, title: "You're always in control", desc: 'You decide who can see or do what — and can revoke access anytime.' },
  { icon: Lock, title: 'Private by default', desc: 'Nothing is shared with family until you choose to share it.' },
  { icon: Flag, title: 'Built to catch scams', desc: 'Flag a suspicious call or email and check with family fast.' },
  { icon: Eye, title: 'Made for older eyes', desc: 'High-contrast colors, large touch targets, and plain language.' },
]

const TESTIMONIALS = [
  { quote: "I like knowing my daughter can see my bills without me having to call her every time.", author: 'Margaret, 74' },
  { quote: "I set a two-minute weekly check-in on my mom's account — it's become part of our Sunday call.", author: 'Priya, caregiver' },
  { quote: "Setting up my prescriptions here means I never show up at the pharmacy empty-handed.", author: 'Walter, 68' },
]

function Cta() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? (
    <Link to="/dashboard" className="btn-primary">Go to My Dashboard</Link>
  ) : (
    <div className="landing-cta-row">
      <Link to="/register" className="btn-primary">Sign Up</Link>
      <Link to="/login" className="btn-secondary">Log In</Link>
    </div>
  )
}

// Desktop-only left rail: how it works, why families trust Kin, real voices.
function LeftRail() {
  return (
    <aside className="landing-left" aria-label="Why families choose Kin">
      <section className="landing-rail-card">
        <h2 className="section-label">How it works</h2>
        <ol className="landing-steps">
          {STEPS.map(s => (
            <li key={s.n} className="landing-step">
              <span className="landing-step-num" aria-hidden="true">{s.n}</span>
              <div>
                <span className="landing-step-title">{s.title}</span>
                <span className="landing-step-desc">{s.desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-rail-card">
        <h2 className="section-label">Why families trust Kin</h2>
        <ul className="landing-trust">
          {TRUST.map(t => (
            <li key={t.title} className="landing-trust-item">
              <t.icon className="landing-trust-icon" size={20} strokeWidth={1.75} aria-hidden="true" />
              <div>
                <span className="landing-trust-title">{t.title}</span>
                <span className="landing-trust-desc">{t.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-rail-card">
        <h2 className="section-label">Real voices</h2>
        <div className="landing-testimonials">
          {TESTIMONIALS.map(t => (
            <figure key={t.author} className="landing-quote">
              <blockquote>"{t.quote}"</blockquote>
              <figcaption>— {t.author}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </aside>
  )
}

// Desktop-only right rail: a working inline email/password login, with links
// to the full login page (phone / Google / security question) and to sign up.
function LoginPanel() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      login({ user_id: data.user_id, role: data.role, full_name: data.full_name, email: data.email }, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <aside className="landing-right" aria-label="Your account">
        <div className="landing-login-card">
          <h2 className="landing-login-title">Welcome back</h2>
          <p className="field-hint mb-sm">You're signed in.</p>
          <Link to="/dashboard" className="btn-primary">Go to My Dashboard</Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className="landing-right" aria-label="Sign in or create an account">
      <div className="landing-login-card">
        <h2 className="landing-login-title">Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="landing-email">Email</label>
            <input id="landing-email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field-group">
            <label htmlFor="landing-password">Password</label>
            <input id="landing-password" type="password" autoComplete="current-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <FormMessage variant="error">{error}</FormMessage>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Logging in…' : 'Log In'}</button>
        </form>
        <Link to="/login" className="landing-login-more">More ways to sign in</Link>
        <div className="landing-login-divider"><span>New to Kin?</span></div>
        <Link to="/register" className="btn-secondary" style={{ width: '100%' }}>Create an account</Link>
      </div>
    </aside>
  )
}

export default function Landing() {
  return (
    <main className="landing-page">
      <LeftRail />

      <div className="landing-center">
        <section className="landing-hero">
          <KinLogo size="lg" />
          <h1 className="landing-tagline">Your Partner in Elder Care and Compassion</h1>
          <p className="landing-subhead">
            A shared, plain-language dashboard for bills, prescriptions, and appointments — so families
            can help without taking over, and older adults stay independent, safe, and in control.
          </p>
          <Cta />
        </section>

        <section className="landing-features">
          <h2 className="section-label">What you can do</h2>
          <div className="landing-features-grid">
            {FEATURES.map(f => (
              <Link key={f.label} to={f.href} className="landing-feature-item">
                <f.icon className="landing-feature-icon" aria-hidden="true" size={26} strokeWidth={1.75} />
                <span className="landing-feature-label">{f.label}</span>
                <span className="landing-feature-desc">{f.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="tip-banner">
          <span className="tip-label">Staying safe</span>
          <p>A real bank will never call asking for your password. If a call or email is rushing you to act right now, that's your cue to slow down — and Kin makes it easy to flag it and check with family.</p>
        </div>

        <section className="landing-hero landing-hero--closing">
          <h2 className="landing-tagline landing-tagline--sm">Ready to get started?</h2>
          <Cta />
        </section>

        <footer className="landing-footer">© Kin</footer>
      </div>

      <LoginPanel />
    </main>
  )
}
