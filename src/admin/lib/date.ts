// Date helpers for <input type="date"> defaults — local calendar date (YYYY-MM-DD), not UTC,
// so "today" is correct for the shop's timezone even late in the evening.
export function today(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function addDays(days: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

// First / last calendar day of the current month (local)
export function monthStart(from: Date = new Date()): string {
  return new Date(from.getFullYear(), from.getMonth(), 1).toLocaleDateString('en-CA')
}
export function monthEnd(from: Date = new Date()): string {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0).toLocaleDateString('en-CA')
}
