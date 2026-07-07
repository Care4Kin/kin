import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',             label: 'Home',     icon: '⌂' },
  { to: '/bills',        label: 'Bills',    icon: '💵' },
  { to: '/prescriptions',label: 'Meds',     icon: '💊' },
  { to: '/flags',        label: 'Alerts',   icon: '🚩' },
  { to: '/circle',       label: 'Circle',   icon: '👥' },
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
