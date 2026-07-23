import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Layout from './components/layout/Layout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import CompleteSignup from './pages/auth/CompleteSignup'
import Dashboard from './pages/dashboard/Dashboard'
import Bills from './pages/bills/Bills'
import Subscriptions from './pages/subscriptions/Subscriptions'
import Prescriptions from './pages/prescriptions/Prescriptions'
import Accounts from './pages/accounts/Accounts'
import Flags from './pages/flags/Flags'
import Notes from './pages/notes/Notes'
import Appointments from './pages/appointments/Appointments'
import AskKin from './pages/ask-kin/AskKin'
import Circle from './pages/circle/Circle'
import Settings from './pages/settings/Settings'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-signup" element={<CompleteSignup />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="bills" element={<Bills />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="flags" element={<Flags />} />
          <Route path="notes" element={<Notes />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="ask-kin" element={<AskKin />} />
          <Route path="circle" element={<Circle />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
