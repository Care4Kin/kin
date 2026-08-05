import { useAuth } from '../../context/AuthContext'

const TIPS = [
  { title: 'Ask before you act', desc: "Even with full permissions, check in before making a change on their behalf — it's their account, and staying involved keeps trust intact." },
  { title: 'Review together, don’t take over', desc: 'A quick shared look at bills or flags — even two minutes on a call — helps far more than quietly handling it yourself.' },
  { title: 'Start with what they’ve shared', desc: "Only look at what they've given you permission to see. If you need more, ask them to update it in My Circle rather than assuming." },
  { title: 'Explain flags gently', desc: "If something looks like a scam, walk through the AI's explanation with them rather than just saying 'delete it' — it helps them recognize it next time." },
  { title: 'Respect a "no"', desc: "If they don't want to add a bill, connect a bank, or share something, that's their call. Being pushy erodes the trust that makes this work." },
  { title: 'Set your own check-in rhythm', desc: 'Use the email digest frequency in Settings to get a gentle nudge — daily, weekly, or monthly — instead of feeling like you need to check constantly.' },
]

export default function CaregiverResources() {
  const { user } = useAuth()
  const isElder = user?.role === 'elder'

  return (
    <div className="page">
      <h1 className="page-title">Supporting Without Overstepping</h1>
      {isElder ? (
        <p className="page-description">
          This page is written for caregivers, but you're welcome to read it too — it's the same guidance we give the people helping you.
        </p>
      ) : (
        <p className="page-description">
          Practical ways to help the person you care about stay independent and in control, while still catching problems early.
        </p>
      )}

      <ol className="resource-steps">
        {TIPS.map((t, i) => (
          <li key={t.title} className="resource-step">
            <span className="landing-step-num">{i + 1}</span>
            <div className="resource-step-body">
              <span className="resource-step-title">{t.title}</span>
              <span className="resource-step-desc">{t.desc}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
