import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OnboardingSlides from '../onboarding/OnboardingSlides'

export default function Layout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <OnboardingSlides />
    </div>
  )
}
