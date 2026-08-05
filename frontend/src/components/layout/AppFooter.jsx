import { Link } from 'react-router-dom'
import KinLogo from '../KinLogo'

// Desktop-only (hidden on mobile via CSS) -- a full sitemap footer for the
// wider desktop layout, where there's room for it and the fixed bottom nav
// isn't competing for the same space.
const COLUMNS = [
  {
    title: 'Track',
    links: [
      { to: '/dashboard', label: 'Home' },
      { to: '/bills', label: 'Bills' },
      { to: '/subscriptions', label: 'Subscriptions' },
      { to: '/prescriptions', label: 'Prescriptions' },
      { to: '/accounts', label: 'Important Accounts' },
      { to: '/appointments', label: 'Appointments' },
    ],
  },
  {
    title: 'Family',
    links: [
      { to: '/ask-kin', label: 'Ask Kin' },
      { to: '/flags', label: 'Suspicious Activity' },
      { to: '/notes', label: 'Shared Notes' },
      { to: '/circle', label: 'My Circle' },
    ],
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
      { to: '/settings', label: 'Settings' },
      { to: '/feedback', label: 'Feedback' },
    ],
  },
]

export default function AppFooter() {
  return (
    <footer className="app-footer" aria-label="Site links">
      <div className="app-footer-columns">
        {COLUMNS.map(col => (
          <div key={col.title} className="app-footer-column">
            <h2 className="app-footer-title">{col.title}</h2>
            <ul className="app-footer-links">
              {col.links.map(l => (
                <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="app-footer-bottom">
        <KinLogo size="sm" to="/dashboard" animate={false} />
        <span>© Kin</span>
      </div>
    </footer>
  )
}
