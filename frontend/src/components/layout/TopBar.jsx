import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function TopBar() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  return (
    <header className="top-bar">
      <Link to="/dashboard" className="top-bar-brand">Kin</Link>
      <div className="top-bar-right">
        {firstName && (
          <span className="top-bar-user">Hi, {firstName}</span>
        )}
        <Link to="/settings" className="top-bar-settings" title="Settings" aria-label="Settings">
          ⚙
        </Link>
      </div>
    </header>
  )
}
