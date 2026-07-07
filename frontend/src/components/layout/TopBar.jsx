import { useAuth } from '../../context/AuthContext'

export default function TopBar() {
  const { user } = useAuth()

  return (
    <header className="top-bar">
      <span className="top-bar-brand">Kin</span>
      {user && <span className="top-bar-user">{user.full_name || 'My Dashboard'}</span>}
    </header>
  )
}
