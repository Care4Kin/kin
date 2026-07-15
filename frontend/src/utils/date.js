export function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

// Given the last date a recurring bank charge happened, project its next
// occurrence one month at a time until it lands today or later.
export function nextOccurrence(lastDateStr) {
  const d = new Date(lastDateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  do {
    d.setMonth(d.getMonth() + 1)
  } while (d < today)
  return d.toISOString().slice(0, 10)
}
