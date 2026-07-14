// Validated categorical palette (dark-surface step, see dataviz skill) — fixed
// order so slice color stays stable as amounts change from render to render.
const CHART_COLORS = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181']
const MAX_SLICES = 7

export default function CategoryPieChart({ entries, title = 'Spending by Category' }) {
  let sorted = [...entries].sort((a, b) => b.amount - a.amount)

  if (sorted.length > MAX_SLICES) {
    const top = sorted.slice(0, MAX_SLICES - 1)
    const restTotal = sorted.slice(MAX_SLICES - 1).reduce((sum, e) => sum + e.amount, 0)
    const otherIndex = top.findIndex(e => e.category.toLowerCase() === 'other')
    if (otherIndex >= 0) {
      top[otherIndex] = { ...top[otherIndex], amount: top[otherIndex].amount + restTotal }
    } else {
      top.push({ category: 'Other', amount: restTotal })
    }
    sorted = top
  }

  const grandTotal = sorted.reduce((sum, e) => sum + e.amount, 0)
  if (grandTotal <= 0) return null

  let cursor = 0
  const slices = sorted.map((entry, i) => {
    const pct = (entry.amount / grandTotal) * 100
    const slice = { ...entry, pct, start: cursor, end: cursor + pct, color: CHART_COLORS[i % CHART_COLORS.length] }
    cursor += pct
    return slice
  })

  const gradient = slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')

  return (
    <div className="pie-chart-card">
      <h2 className="section-label">{title}</h2>
      <div className="pie-chart-body">
        <div
          className="pie-chart-donut"
          style={{ background: `conic-gradient(${gradient})` }}
          role="img"
          aria-label={`${title}: ${slices.map(s => `${s.category} ${s.pct.toFixed(0)}%`).join(', ')}`}
        >
          <div className="pie-chart-hole">
            <span className="pie-chart-total">${grandTotal.toFixed(0)}</span>
            <span className="pie-chart-total-label">total</span>
          </div>
        </div>
        <ul className="pie-chart-legend">
          {slices.map(s => (
            <li key={s.category}>
              <span className="pie-chart-swatch" style={{ background: s.color }} aria-hidden="true" />
              <span className="pie-chart-legend-label">{s.category}</span>
              <span className="pie-chart-legend-value">${s.amount.toFixed(2)} ({s.pct.toFixed(0)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
