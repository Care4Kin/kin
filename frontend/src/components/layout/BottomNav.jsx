import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/dashboard'} className="bottom-nav-item">
          <Icon className="bottom-nav-icon" aria-hidden="true" size={22} strokeWidth={2} />
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
