import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const SUGGESTIONS = [
  "When's my next bill due?",
  "What's my Netflix costing me a year?",
  'Do I have any appointments coming up?',
  'Which prescriptions need a refill soon?',
]

export default function AskKin() {
  const { circleId } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!circleId) return <p className="page-status">Loading…</p>

  async function send(text) {
    const question = text.trim()
    if (!question || sending) return
    setError('')
    setInput('')
    const history = messages
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setSending(true)
    try {
      const res = await api.askKin(circleId, { message: question, history })
      setMessages(prev => [...prev, { role: 'model', content: res.reply }])
    } catch (err) {
      setError(err.message || "Ask Kin couldn't answer that. Please try again.")
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="page ask-kin-page">
      <h1 className="page-title">Ask Kin</h1>

      {messages.length === 0 && (
        <div className="chat-suggestions">
          <p className="info-row-label">Try asking:</p>
          {SUGGESTIONS.map(s => (
            <button key={s} type="button" className="chat-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-thread">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
            {m.content}
          </div>
        ))}
        {sending && <div className="chat-bubble chat-bubble--model chat-bubble--pending">Thinking…</div>}
      </div>

      {error && <p className="page-status page-status--error">{error}</p>}

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about bills, meds, subscriptions…"
          aria-label="Ask Kin a question"
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>Send</button>
      </form>
    </div>
  )
}
