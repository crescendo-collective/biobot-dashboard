const MS_PER_DAY = 24 * 60 * 60 * 1000
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Strips time-of-day, keeping only the local calendar date. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Sunday of the epi week (MMWR convention: Sun–Sat) containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Saturday of the same epi week as `weekStart` (assumes weekStart is
 * already Sunday-aligned, e.g. from getWeekStart). */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12)
}

/** Whole weeks between two Sunday-aligned dates. Negative if `a` is
 * after `b`. */
export function diffInWeeks(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (MS_PER_DAY * 7))
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) return min
  if (date.getTime() > max.getTime()) return max
  return date
}

/** "Apr 29, 2026" */
export function formatShortDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** "2026-04-29" — for the date-range picker's input display. */
export function formatISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "Apr 12 – Apr 18, 2026" (always shows both month abbreviations, even
 * when start/end fall in the same month, matching the reference design
 * exactly). Assumes weekStart is Sunday-aligned. */
export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart)
  const startMonth = MONTH_NAMES[weekStart.getMonth()]
  const endMonth = MONTH_NAMES[weekEnd.getMonth()]

  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
}
