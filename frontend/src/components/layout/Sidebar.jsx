import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', description: 'Your home overview' },
  { to: '/bills', label: 'Bills', description: 'Track what you owe' },
  { to: '/subscriptions', label: 'Subscriptions', description: 'Monthly services' },
  { to: '/prescriptions', label: 'Prescriptions', description: 'Your medications' },
  { to: '/accounts', label: 'Accounts', description: 'Important accounts' },
  { to: '/bank', label: 'Bank Accounts', description: 'Link a bank for spending insights' },
  { to: '/appointments', label: 'Appointments', description: 'Upcoming visits' },
  { to: '/flags', label: 'Suspicious Activity', description: 'Report something odd' },
  { to: '/notes', label: 'Notes', description: 'Leave a message' },
  { to: '/circle', label: 'My Circle', description: 'Manage who helps you' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Kin</div>
      <ul className="sidebar-nav">
        {navItems.map(({ to, label, description }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'}>
              <span className="nav-label">{label}</span>
              <span className="nav-description">{description}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <span>{user?.full_name}</span>
        <button onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}
