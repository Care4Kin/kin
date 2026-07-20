import { useAuth } from '../context/AuthContext'

export default function NoCircleGate({ title }) {
  const { user } = useAuth()
  const isElder = user?.role === 'elder'

  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <div className="login-gate">
        {isElder ? (
          <p className="field-hint">Something went wrong setting up your family circle. Try refreshing the page — if this keeps happening, let us know.</p>
        ) : (
          <>
            <p className="field-hint">You haven't been added to a family circle yet.</p>
            <p className="field-hint">Ask the person you're helping to invite you using this email address: <strong>{user?.email}</strong></p>
          </>
        )}
      </div>
    </div>
  )
}
