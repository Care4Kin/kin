import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/bills',   label: 'Bills',    icon: '💵' },
  { to: '/ask-kin', label: 'Ask Kin',  icon: '💬' },
  { to: '/',        label: 'Home',     icon: '⌂' },
  { to: '/flags',   label: 'Alerts',   icon: '🚩' },
  { to: '/circle',  label: 'Circle',   icon: '👥' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="bottom-nav-item">
          <span className="bottom-nav-icon" aria-hidden="true">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
