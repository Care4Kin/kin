const FAQ_GROUPS = [
  {
    topic: 'Getting Started',
    items: [
      { q: 'What is a "circle"?', a: 'A circle is you (the elder) plus the family members or caregivers you invite. Everyone in a circle can see whatever you choose to share with them — nothing more.' },
      { q: 'Do I need a password?', a: "No. When you sign up, you can leave the password blank and use your phone number or security question to sign in instead — whichever is easier to remember." },
      { q: 'Can I use Kin without a bank account connected?', a: 'Yes. Connecting a bank account is optional — it just lets Kin suggest bills and subscriptions it notices automatically. Everything else works fine without it.' },
    ],
  },
  {
    topic: 'Permissions & Privacy',
    items: [
      { q: 'Can my family member see everything on my account?', a: "Only what you allow. You control each permission — Bills, Prescriptions, Accounts, Subscriptions, Appointments, and Suspicious Activity — separately, and you can change any of them at any time from My Circle." },
      { q: 'Can I remove someone from my circle?', a: 'Yes, at any time, from the My Circle page. Removing someone immediately stops their access.' },
    ],
  },
  {
    topic: 'Bills, Subscriptions & Accounts',
    items: [
      { q: 'What are the "Detected From Your Bank" suggestions?', a: "If you've connected a bank account, Kin looks for recurring charges and suggests adding them as a bill or subscription. You choose whether to add it or dismiss it — nothing is added automatically." },
      { q: 'What if I dismiss a suggestion by mistake?', a: "Right now a dismissed suggestion won't reappear on its own. You can always add the bill or subscription manually instead." },
    ],
  },
  {
    topic: 'Prescriptions',
    items: [
      { q: 'What does the pill streak track?', a: "It counts consecutive days you've marked every scheduled pill as taken, so you can see your medication habit at a glance." },
    ],
  },
  {
    topic: 'Suspicious Activity & Safety',
    items: [
      { q: 'What should I flag?', a: "Any call, email, text, or bill that feels off — even if you're not sure it's a scam. It's always better to flag and check than to ignore it." },
      { q: 'What happens after I flag something?', a: "Kin's AI gives you a plain-language read on how closely it matches a common scam pattern, plus a suggested next step. Anything rated high risk also emails the other people in your circle right away." },
      { q: 'What if I need to talk to a real person?', a: 'Visit the Suspicious Activity page for real phone numbers (AARP Fraud Watch Helpline, Medicare, Eldercare Locator), or ask Ask Kin "How do I reach a real person for help?"' },
    ],
  },
]

export default function Faq() {
  return (
    <div className="page">
      <h1 className="page-title">Frequently Asked Questions</h1>
      <p className="page-description">Quick answers to common questions — no need to call anyone.</p>

      {FAQ_GROUPS.map(group => (
        <section key={group.topic} className="mb-lg">
          <h2 className="section-label">{group.topic}</h2>
          <div className="card-list">
            {group.items.map(item => (
              <details key={item.q} className="info-card faq-item">
                <summary className="info-card-title">{item.q}</summary>
                <p className="info-card-note mt-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
