import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-switch">Coming soon.</p>
        <p className="auth-switch">
          <Link to="/login">Back to Log In</Link>
        </p>
      </div>
    </div>
  )
}
