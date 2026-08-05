const SECTIONS = [
  { title: 'At a Glance', desc: "Right at the top of your dashboard: unpaid bills, anything flagged, refills due soon, and your next appointment — the things worth checking first." },
  { title: 'Bills & Subscriptions', desc: 'Track what you owe and your monthly services in one place. If a bank account is connected, Kin will suggest ones it notices automatically — you choose whether to add them.' },
  { title: 'Prescriptions', desc: "Medication name, dosage, refill date, and pharmacy, plus a daily checklist so it's easy to see what's been taken today." },
  { title: 'Appointments', desc: 'Upcoming visits with date, time, place, and notes — split into Upcoming and Past so the list stays easy to scan.' },
  { title: 'Ask Kin', desc: "A quick way to ask about your bills, meds, or subscriptions in plain language — and how to reach a real person if you'd rather talk to someone." },
  { title: 'Suspicious Activity', desc: "If something feels off — a call, email, text, or bill — flag it here. Kin's AI gives a plain-language read on how it matches common scam patterns and a suggested next step." },
  { title: 'Shared Notes', desc: 'A place to leave messages for your family, right in the app — no back-and-forth calls needed.' },
  { title: 'My Circle', desc: "See who's helping and exactly what each person can see. You can change any permission, or remove someone, at any time." },
]

export default function HowItWorks() {
  return (
    <div className="page">
      <h1 className="page-title">How Kin Works</h1>
      <p className="page-description">
        A short walkthrough of each part of the dashboard, and what to do if something is ever flagged.
      </p>

      <ol className="resource-steps">
        {SECTIONS.map((s, i) => (
          <li key={s.title} className="resource-step">
            <span className="landing-step-num">{i + 1}</span>
            <div className="resource-step-body">
              <span className="resource-step-title">{s.title}</span>
              <span className="resource-step-desc">{s.desc}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="stat-banner mt-lg">
        <span className="stat-banner-label">Something flagged?</span>
        <span className="stat-banner-value" aria-hidden="true">→</span>
      </div>
      <p className="field-hint mt-sm">
        Read the AI's explanation and suggested next step on the Suspicious Activity page. If you're not sure, use Ask Kin or call a real person — AARP's Fraud Watch Helpline is 1-877-908-3360, any day.
      </p>
    </div>
  )
}
