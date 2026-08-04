import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OnboardingSlides from '../onboarding/OnboardingSlides'

export default function Layout() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <OnboardingSlides />
    </div>
  )
}
