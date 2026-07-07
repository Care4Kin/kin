import { useAuth } from '../../context/AuthContext'

const TIPS = [
  'You can add a bill by tapping Bills in the menu below.',
  'Your family can only see what you choose to share with them.',
  'Check your prescriptions tab before your next doctor visit.',
  'If something feels like a scam, flag it — better safe than sorry.',
  'You are always in charge of your circle. You can remove anyone at any time.',
]

const todaysTip = TIPS[new Date().getDay() % TIPS.length]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="page dashboard">
      <div className="tip-banner">
        <span className="tip-label">Tip for today</span>
        <p>{todaysTip}</p>
      </div>

      <div className="dashboard-grid">
        <SummaryCard
          title="Bills"
          description="Track what you owe and when it's due"
          href="/bills"
          accent="green"
        />
        <SummaryCard
          title="Prescriptions"
          description="See upcoming refill dates"
          href="/prescriptions"
          accent="green"
        />
        <SummaryCard
          title="Subscriptions"
          description="Review your monthly services"
          href="/subscriptions"
          accent="green"
        />
        <SummaryCard
          title="Important Accounts"
          description="Bank, insurance, healthcare and more"
          href="/accounts"
          accent="green"
        />
        <SummaryCard
          title="Suspicious Activity"
          description="Flag a scam call, email, or bill"
          href="/flags"
          accent="warn"
        />
        <SummaryCard
          title="Shared Notes"
          description="Leave a message for your family"
          href="/notes"
          accent="green"
        />
      </div>
    </div>
  )
}

function SummaryCard({ title, description, href, accent }) {
  return (
    <a href={href} className={`summary-card summary-card--${accent}`}>
      <h2>{title}</h2>
      <p>{description}</p>
    </a>
  )
}
