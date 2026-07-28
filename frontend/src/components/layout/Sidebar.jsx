import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export default function Sidebar() {
  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/dashboard'} className="sidebar-nav-item">
          <Icon className="sidebar-nav-icon" aria-hidden="true" size={20} strokeWidth={2} />
          <span className="sidebar-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
