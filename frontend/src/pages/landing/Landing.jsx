import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const FEATURES = [
  { icon: '💵', label: 'Bills', desc: "Track what you owe and when it's due", href: '/bills' },
  { icon: '🔁', label: 'Subscriptions', desc: 'Review your monthly services', href: '/subscriptions' },
  { icon: '💊', label: 'Prescriptions', desc: 'See upcoming refill dates', href: '/prescriptions' },
  { icon: '🏦', label: 'Important Accounts', desc: 'Bank, insurance, healthcare and more', href: '/accounts' },
  { icon: '📅', label: 'Appointments', desc: 'Upcoming visits and reminders', href: '/appointments' },
  { icon: '🚩', label: 'Suspicious Activity', desc: 'Flag a scam call, email, or bill', href: '/flags' },
  { icon: '📝', label: 'Shared Notes', desc: 'Leave a message for your family', href: '/notes' },
  { icon: '👥', label: 'Family Circle', desc: "See who's helping and manage access", href: '/circle' },
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

export default function Landing() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <span className="top-bar-brand">Kin</span>
        <h1 className="landing-tagline">KIN: Your Partner in Elder Care and Compassion</h1>
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
              <span className="landing-feature-icon" aria-hidden="true">{f.icon}</span>
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
    </main>
  )
}
