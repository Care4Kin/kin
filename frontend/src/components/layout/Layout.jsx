import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function Layout() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
