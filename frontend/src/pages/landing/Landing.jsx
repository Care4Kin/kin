import { Link } from 'react-router-dom'
import { DollarSign, Repeat, Pill, Landmark, Calendar, Flag, FileText, Users, ShieldCheck, Lock, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import KinLogo from '../../components/KinLogo'

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

const TESTIMONIAL = { quote: "I like knowing my daughter can see my bills without me having to call her every time.", author: 'Margaret, 74' }

const FOOTER_COLUMNS = [
  {
    title: 'What You Can Do',
    links: FEATURES.map(f => ({ to: f.href, label: f.label })),
  },
  {
    title: 'Help & Resources',
    links: [
      { to: '/how-it-works', label: 'How Kin Works' },
      { to: '/faq', label: 'FAQ' },
      { to: '/scam-library', label: 'Scam Reference Library' },
      { to: '/caregiver-resources', label: 'Caregiver Resources' },
      { to: '/device-guide', label: 'Device Setup Guide' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log In' },
      { to: '/register', label: 'Sign Up' },
    ],
  },
]

function Cta() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? (
    <Link to="/dashboard" className="btn-primary landing-cta-btn">Go to My Dashboard</Link>
  ) : (
    <div className="landing-cta-row">
      <Link to="/register" className="btn-primary landing-cta-btn">Get Started</Link>
      <Link to="/login" className="landing-cta-link">Already have an account? Log in</Link>
    </div>
  )
}

function NavLinks() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? (
    <Link to="/dashboard" className="btn-secondary landing-nav-btn">Go to Dashboard</Link>
  ) : (
    <div className="landing-nav-links">
      <Link to="/login" className="landing-nav-login">Log In</Link>
      <Link to="/register" className="btn-primary landing-nav-btn">Sign Up</Link>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="landing-v2">
      <header className="landing-nav">
        <KinLogo size="sm" to="/" />
        <NavLinks />
      </header>

      <section className="landing-hero">
        <div className="landing-inner landing-hero-inner">
          <h1 className="landing-tagline">Your partner in elder care and compassion</h1>
          <p className="landing-subhead">
            A shared, plain-language dashboard for bills, prescriptions, and appointments — so families
            can help without taking over, and older adults stay independent, safe, and in control.
          </p>
          <Cta />
        </div>
      </section>

      <section className="landing-trust-row">
        <div className="landing-inner">
          <div className="landing-trust-grid">
            {TRUST.map(t => (
              <div key={t.title} className="landing-trust-item">
                <t.icon className="landing-trust-icon" size={22} strokeWidth={1.75} aria-hidden="true" />
                <span className="landing-trust-title">{t.title}</span>
                <span className="landing-trust-desc">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-inner">
          <h2 className="landing-section-title">What you can do</h2>
          <div className="landing-features-grid">
            {FEATURES.map(f => (
              <Link key={f.label} to={f.href} className="landing-feature-item">
                <f.icon className="landing-feature-icon" aria-hidden="true" size={24} strokeWidth={1.75} />
                <span className="landing-feature-label">{f.label}</span>
                <span className="landing-feature-desc">{f.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-steps-section">
        <div className="landing-inner">
          <h2 className="landing-section-title">How it works</h2>
          <ol className="landing-steps-row">
            {STEPS.map(s => (
              <li key={s.n} className="landing-step-col">
                <span className="landing-step-num" aria-hidden="true">{s.n}</span>
                <span className="landing-step-title">{s.title}</span>
                <span className="landing-step-desc">{s.desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-safety-band">
        <div className="landing-inner">
          <span className="landing-band-label">Staying safe</span>
          <p className="landing-band-text">
            A real bank will never call asking for your password. If a call or email is rushing you to act
            right now, that's your cue to slow down — and Kin makes it easy to flag it and check with family.
          </p>
        </div>
      </section>

      <section className="landing-testimonial">
        <div className="landing-inner">
          <blockquote className="landing-testimonial-quote">"{TESTIMONIAL.quote}"</blockquote>
          <cite className="landing-testimonial-author">— {TESTIMONIAL.author}</cite>
        </div>
      </section>

      <section className="landing-cta-band">
        <div className="landing-inner">
          <h2 className="landing-tagline landing-tagline--sm">Ready to get started?</h2>
          <Cta />
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-inner">
          <div className="landing-footer-columns">
            {FOOTER_COLUMNS.map(col => (
              <div key={col.title} className="landing-footer-column">
                <h2 className="landing-footer-title">{col.title}</h2>
                <ul className="landing-footer-links">
                  {col.links.map(l => (
                    <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="landing-footer-bottom">
            <KinLogo size="sm" animate={false} />
            <span>© Kin</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
