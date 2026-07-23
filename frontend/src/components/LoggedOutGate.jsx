import { Link } from 'react-router-dom'

export default function LoggedOutGate({ title, description }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      <div className="login-gate">
        <p className="field-hint">Log in to see this for your family.</p>
        <div className="login-gate-actions">
          <Link to="/login" className="btn-primary">Log In</Link>
          <Link to="/register" className="btn-secondary">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}
