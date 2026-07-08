import { useAuth } from '../../context/AuthContext'

export default function TopBar() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  return (
    <header className="top-bar">
      <span className="top-bar-brand">Kin</span>
      {firstName && (
        <span className="top-bar-user">Hi, {firstName}</span>
      )}
    </header>
  )
}
