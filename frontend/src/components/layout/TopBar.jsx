import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import KinLogo from '../KinLogo'

export default function TopBar() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  return (
    <header className="top-bar">
      <KinLogo size="sm" to="/" />
      <div className="top-bar-right">
        {user ? (
          <>
            {firstName && (
              <span className="top-bar-user">Hi, {firstName}</span>
            )}
            <Link to="/settings" className="top-bar-settings" title="Settings" aria-label="Settings">
              <Settings size={20} strokeWidth={2} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link to="/login" className="top-bar-login">Log In</Link>
        )}
      </div>
    </header>
  )
}
