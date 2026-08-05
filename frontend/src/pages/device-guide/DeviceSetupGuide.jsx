const STEPS = [
  { title: 'Find the web browser', desc: "On an iPhone or iPad, it's the blue compass icon called Safari. On Android, it's usually a colorful circle called Chrome." },
  { title: 'Go to the Kin website', desc: "Have them tap the address bar at the top and type the Kin web address, then tap Go or the arrow on the keyboard." },
  { title: '"Add to Home Screen"', desc: "So they don't have to type the address every time: tap the Share icon (a square with an arrow, iPhone) or the three-dot menu (Android), then choose \"Add to Home Screen.\" A Kin icon now appears like any other app." },
  { title: 'Sign up together', desc: "Walk them through Sign Up on the phone — full name, email, and either a password or just a security question if they'd rather not remember one." },
  { title: 'Invite yourself to their circle', desc: 'Once they\'re signed in, go to My Circle and have them invite you by email. You\'ll get an email to accept.' },
  { title: 'Turn on larger text if needed', desc: 'In Settings → Accessibility, they can switch to Large or Extra Large text right from their phone.' },
]

export default function DeviceSetupGuide() {
  return (
    <div className="page">
      <h1 className="page-title">Device Setup Guide</h1>
      <p className="page-description">
        A plain-language walkthrough for helping a family member get Kin set up on their phone or tablet — even over the phone, without being in the same room.
      </p>

      <ol className="resource-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="resource-step">
            <span className="landing-step-num">{i + 1}</span>
            <div className="resource-step-body">
              <span className="resource-step-title">{s.title}</span>
              <span className="resource-step-desc">{s.desc}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
