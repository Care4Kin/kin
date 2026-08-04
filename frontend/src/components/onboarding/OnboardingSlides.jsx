import { useState, useEffect } from 'react'
import { DollarSign, Pill, Landmark, MessageCircle, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import KinLogo from '../KinLogo'

function buildSlides(isCaregiver) {
  return [
    {
      brand: true,
      title: 'Welcome to Kin',
      body: isCaregiver
        ? "You're here to help someone you care about stay on top of things — while respecting their independence."
        : 'One place to keep track of bills, prescriptions, and more — and bring in people you trust to help, only if and when you want to.',
    },
    {
      icons: [DollarSign, Pill, Landmark],
      title: 'Keep track of what matters',
      body: 'Bills, prescriptions, subscriptions, accounts, and appointments — all in one simple place.',
    },
    {
      icons: [MessageCircle],
      title: 'Ask Kin anything',
      body: "Have a question about a bill or a medication? Just ask — Kin's assistant is built right in.",
    },
    {
      icons: [Users],
      title: isCaregiver ? "Respecting their independence" : "You're always in control",
      body: isCaregiver
        ? "You'll only ever see what they choose to share with you — that's by design."
        : 'Invite the people you trust, and choose exactly what each person can see. You can change it anytime.',
    },
  ]
}

export default function OnboardingSlides() {
  const { user, loading: authLoading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (authLoading || !user) return
    api.getMe().then(me => {
      if (!me.has_seen_onboarding) setVisible(true)
    }).catch(() => {})
  }, [user, authLoading])

  if (!visible) return null

  const isCaregiver = user?.role === 'caregiver'
  const slides = buildSlides(isCaregiver)
  const slide = slides[step]
  const isLast = step === slides.length - 1

  function dismiss() {
    setVisible(false)
    api.updateProfile({ has_seen_onboarding: true }).catch(() => {})
  }

  function next() {
    if (isLast) dismiss()
    else setStep(s => s + 1)
  }

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <button type="button" className="onboarding-skip" onClick={dismiss}>Skip</button>

        <div className="onboarding-content">
          {slide.brand ? (
            <KinLogo size="lg" />
          ) : (
            <div className="onboarding-icons">
              {slide.icons.map((Icon, i) => <Icon key={i} size={32} strokeWidth={1.75} aria-hidden="true" />)}
            </div>
          )}
          <h2 id="onboarding-title" className="onboarding-title">{slide.title}</h2>
          <p className="onboarding-body">{slide.body}</p>
        </div>

        <div className="onboarding-dots" aria-hidden="true">
          {slides.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'onboarding-dot--active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
          )}
          <button type="button" className="btn-primary" onClick={next}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
