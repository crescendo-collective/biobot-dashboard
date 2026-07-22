import { useEffect, useRef, useState } from 'react'
import {
  addMonths,
  addYears,
  formatISODate,
  isSameDay,
  startOfDay,
} from '@/utils/dateWeeks'
import './DateRangePicker.scss'

export interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  /** Earliest selectable date — e.g. when the underlying dataset begins. */
  minDate: Date
  /** Latest selectable date — "today", selection can't reach into the future. */
  maxDate: Date
  onChange: (start: Date, end: Date) => void
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface PresetOption {
  label: string
  getRange: (maxDate: Date, minDate: Date) => [Date, Date]
}

const PRESETS: PresetOption[] = [
  { label: 'Last 3 Months', getRange: (max) => [addMonths(max, -3), max] },
  { label: 'Last 6 Months', getRange: (max) => [addMonths(max, -6), max] },
  { label: 'Last Year', getRange: (max) => [addYears(max, -1), max] },
]

/** Days for a single calendar month grid, including the leading/trailing
 * days from adjacent months needed to fill out full weeks. */
function getMonthGrid(monthDate: Date): Array<{ date: Date; inMonth: boolean }> {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ date: Date; inMonth: boolean }> = []

  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, i - startWeekday + 1)
    cells.push({ date: d, inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true })
  }
  // Pad to a multiple of 7 for a clean grid.
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
  }

  return cells
}

export default function DateRangePicker({
  startDate,
  endDate,
  minDate,
  maxDate,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // In-progress selection while the popover is open — committed (via
  // onChange) once both ends are picked, so a half-made selection
  // doesn't affect the actual timeline until it's complete.
  const [draftStart, setDraftStart] = useState<Date | null>(null)
  const [draftEnd, setDraftEnd] = useState<Date | null>(null)
  const [leftMonth, setLeftMonth] = useState<Date>(() => startOfDay(new Date(startDate.getFullYear(), startDate.getMonth(), 1)))

  const rootRef = useRef<HTMLDivElement>(null)
  const today = startOfDay(new Date())

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const openPicker = () => {
    setDraftStart(null)
    setDraftEnd(null)
    setLeftMonth(startOfDay(new Date(startDate.getFullYear(), startDate.getMonth(), 1)))
    setIsOpen(true)
  }

  const applyPreset = (preset: PresetOption) => {
    const [start, end] = preset.getRange(maxDate, minDate)
    onChange(start, end)
    setIsOpen(false)
  }

  const handleDayClick = (day: Date) => {
    if (day.getTime() < minDate.getTime() || day.getTime() > maxDate.getTime()) return

    if (!draftStart || draftEnd) {
      // Starting a fresh selection.
      setDraftStart(day)
      setDraftEnd(null)
      return
    }

    // Second click completes the range.
    const [rangeStart, rangeEnd] = day.getTime() < draftStart.getTime() ? [day, draftStart] : [draftStart, day]
    setDraftStart(rangeStart)
    setDraftEnd(rangeEnd)
    onChange(rangeStart, rangeEnd)
    setIsOpen(false)
  }

  const displayStart = draftStart ?? startDate
  const displayEnd = draftEnd ?? (draftStart ? draftStart : endDate)

  const isInRange = (day: Date) =>
    day.getTime() >= displayStart.getTime() && day.getTime() <= displayEnd.getTime()

  const rightMonth = addMonths(leftMonth, 1)

  const renderMonth = (monthDate: Date) => (
    <div className="date-picker-month">
      <div className="date-picker-month-grid-header">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="date-picker-month-grid">
        {getMonthGrid(monthDate).map(({ date, inMonth }) => {
          const disabled = date.getTime() < minDate.getTime() || date.getTime() > maxDate.getTime()
          const selected = isSameDay(date, displayStart) || isSameDay(date, displayEnd)
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={[
                'date-picker-day',
                !inMonth && 'is-outside',
                disabled && 'is-disabled',
                inMonth && isInRange(date) && 'is-in-range',
                selected && 'is-selected',
                isSameDay(date, today) && 'is-today',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={disabled}
              onClick={() => handleDayClick(date)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="date-range-picker" ref={rootRef}>
      <button type="button" className="date-range-picker-trigger" onClick={openPicker}>
        <span>{formatISODate(startDate)}</span>
        <span className="date-range-picker-arrow">→</span>
        <span>{formatISODate(endDate)}</span>
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 6.5h12M5 2v2.5M11 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="date-range-picker-popover">
          <div className="date-picker-presets">
            {PRESETS.map((preset) => (
              <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>
                {preset.label}
              </button>
            ))}
          </div>

          <div className="date-picker-calendars">
            <div className="date-picker-calendar-header">
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => setLeftMonth((m) => addYears(m, -1))}
                aria-label="Previous year"
              >
                «
              </button>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => setLeftMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="date-picker-month-label">
                {MONTH_NAMES[leftMonth.getMonth()]} {leftMonth.getFullYear()}
              </span>
              <span className="date-picker-month-label">
                {MONTH_NAMES[rightMonth.getMonth()]} {rightMonth.getFullYear()}
              </span>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => setLeftMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                ›
              </button>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => setLeftMonth((m) => addYears(m, 1))}
                aria-label="Next year"
              >
                »
              </button>
            </div>

            <div className="date-picker-calendar-grids">
              {renderMonth(leftMonth)}
              {renderMonth(rightMonth)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
