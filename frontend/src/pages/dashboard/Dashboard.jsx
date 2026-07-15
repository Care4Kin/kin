import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { daysUntil } from '../../utils/date'
import LoggedOutGate from '../../components/LoggedOutGate'

const TIPS = [
  'You can add a bill by tapping Bills in the menu below.',
  'Your family can only see what you choose to share with them.',
  'Check your prescriptions tab before your next doctor visit.',
  'If something feels like a scam, flag it — better safe than sorry.',
  'You are always in charge of your circle. You can remove anyone at any time.',
  "Fun fact: putting your password in the freezer does not make it more secure. A password manager does.",
  "A real bank will never call asking for your password. When in doubt, hang up and call them back yourself.",
  "Scammers love urgency. If a call or email is rushing you to act right now, that's your cue to slow down.",
]

const SIGNUP_TIPS = [
  "Welcome to Kin! Quick tip: no bank or government agency will ever ask for your password over the phone — not even us.",
  "You're all set up. Fun fact: the freezer is a great place for ice cream, not passwords — a password manager works better.",
  "Glad you're here. One habit that helps: if a call or text feels urgent and scary, that's exactly when to slow down and check with family.",
]

function getTodaysTip() {
  return TIPS[new Date().getDay() % TIPS.length]
}

function getSignupTip() {
  return SIGNUP_TIPS[Math.floor(Math.random() * SIGNUP_TIPS.length) % SIGNUP_TIPS.length]
}

export default function Dashboard() {
  const { user, circleId, loading: authLoading } = useAuth()
  const location = useLocation()
  const justSignedUp = Boolean(location.state?.justSignedUp)
  const [counts, setCounts] = useState({})
  const [data, setData] = useState(null)
  const [bankCount, setBankCount] = useState(0)

  useEffect(() => {
    if (!circleId) return
    Promise.all([
      api.getBills(circleId),
      api.getPrescriptions(circleId),
      api.getSubscriptions(circleId),
      api.getAppointments(circleId),
      api.getAccounts(circleId),
      api.getFlags(circleId),
      api.getNotes(circleId),
      api.getCircle(circleId),
    ]).then(([bills, prescriptions, subscriptions, appointments, accounts, flags, notes, circle]) => {
      setCounts({
        bills: bills.length,
        prescriptions: prescriptions.length,
        subscriptions: subscriptions.length,
        appointments: appointments.length,
        accounts: accounts.length,
        flags: flags.length,
        notes: notes.length,
        circle: circle.members.length,
      })
      setData({ bills, prescriptions, appointments, flags })
    }).catch(() => {})

    // Fetched separately from the rest — Plaid may not be configured, and a
    // failure here shouldn't blank out every other card's count.
    api.getPlaidAccounts(circleId).then(accs => setBankCount(accs.length)).catch(() => {})
  }, [circleId])

  const accountsCount = (counts.accounts || 0) + bankCount

  const isCaregiver = user?.role === 'caregiver'
  const [tip] = useState(() => justSignedUp ? getSignupTip() : getTodaysTip())

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Dashboard" description="Your home base — bills, prescriptions, appointments, and more, all in one place, shared with your family." />

  return (
    <div className="page dashboard">
      <div className="tip-banner">
        <span className="tip-label">{justSignedUp ? 'Welcome' : 'Tip for today'}</span>
        <p>{tip}</p>
      </div>

      {isCaregiver && data && <CaregiverSummary data={data} />}

      <div className="dashboard-grid">
        <SummaryCard title="Bills" description="Track what you owe and when it's due" href="/bills" accent="green" count={counts.bills} />
        <SummaryCard title="Prescriptions" description="See upcoming refill dates" href="/prescriptions" accent="green" count={counts.prescriptions} />
        <SummaryCard title="Subscriptions" description="Review your monthly services" href="/subscriptions" accent="green" count={counts.subscriptions} />
        <SummaryCard title="Appointments" description="Upcoming visits and reminders" href="/appointments" accent="green" count={counts.appointments} />
        <SummaryCard title="Important Accounts" description="Bank, insurance, healthcare and more" href="/accounts" accent="green" count={accountsCount} />
        <SummaryCard title="Suspicious Activity" description="Flag a scam call, email, or bill" href="/flags" accent="warn" count={counts.flags} />
        <SummaryCard title="Shared Notes" description="Leave a message for your family" href="/notes" accent="green" count={counts.notes} />
        <SummaryCard title="My Circle" description="See who's helping and manage access" href="/circle" accent="green" count={counts.circle} />
      </div>
    </div>
  )
}

function SummaryCard({ title, description, href, accent, count }) {
  return (
    <Link to={href} className={`summary-card summary-card--${accent}`}>
      {Boolean(count) && <span className="summary-card-count">{count}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
    </Link>
  )
}

function CaregiverSummary({ data }) {
  const unpaidBills = data.bills.filter(b => !b.is_paid)
  const unpaidTotal = unpaidBills.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const openFlags = data.flags.filter(f => !f.is_resolved)
  const upcomingRx = data.prescriptions.filter(rx => {
    if (!rx.refill_date) return false
    const days = daysUntil(rx.refill_date)
    return days >= 0 && days <= 10
  })
  const nextAppt = [...data.appointments].sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div className="caregiver-summary">
      <h2 className="section-label">At a Glance</h2>
      <div className="caregiver-stats">
        <StatTile
          label="Unpaid Bills"
          value={`$${unpaidTotal.toFixed(2)}`}
          sub={`${unpaidBills.length} bill${unpaidBills.length === 1 ? '' : 's'}`}
          warn={unpaidBills.length > 0}
        />
        <StatTile
          label="Needs Attention"
          value={openFlags.length}
          sub="open flags"
          warn={openFlags.length > 0}
        />
        <StatTile
          label="Refills Due Soon"
          value={upcomingRx.length}
          sub="within 10 days"
          warn={upcomingRx.length > 0}
        />
        <StatTile
          label="Next Appointment"
          value={nextAppt ? new Date(nextAppt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          sub={nextAppt?.title || 'None scheduled'}
        />
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, warn }) {
  return (
    <div className={`stat-tile ${warn ? 'stat-tile--warn' : ''}`}>
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-sub">{sub}</span>
    </div>
  )
}
