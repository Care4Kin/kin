export function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

export const DAY_CODES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const DAY_LETTERS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' }
export const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

// Matches the backend's Monday-start week (Python's date.weekday(), 0=Monday).
export function todayCode() {
  const jsDay = new Date().getDay() // 0 = Sunday .. 6 = Saturday
  return DAY_CODES[jsDay === 0 ? 6 : jsDay - 1]
}

// This week's 7 dates (Monday through Sunday) as { code, date: 'YYYY-MM-DD' }.
export function getCurrentWeek() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const jsDay = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + (jsDay === 0 ? -6 : 1 - jsDay))

  return DAY_CODES.map((code, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { code, date: d.toISOString().slice(0, 10) }
  })
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
