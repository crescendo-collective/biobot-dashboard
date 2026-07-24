import { useEffect, useRef, useState } from 'react'
import { DayPicker, type DateRange } from '@daypicker/react'
import '@daypicker/react/style.css'
import { addMonths, addYears, formatISODate } from '@/utils/dateWeeks'
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

interface PresetOption {
  label: string
  getRange: (maxDate: Date) => [Date, Date]
}

const PRESETS: PresetOption[] = [
  { label: 'Last 3 Months', getRange: (max) => [addMonths(max, -3), max] },
  { label: 'Last 6 Months', getRange: (max) => [addMonths(max, -6), max] },
  { label: 'Last Year', getRange: (max) => [addYears(max, -1), max] },
]

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
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined)

  const rootRef = useRef<HTMLDivElement>(null)

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
    setDraftRange({ from: startDate, to: endDate })
    setIsOpen(true)
  }

  const applyPreset = (preset: PresetOption) => {
    const [start, end] = preset.getRange(maxDate)
    onChange(start, end)
    setIsOpen(false)
  }

  const handleSelect = (range: DateRange | undefined) => {
    setDraftRange(range)
    // DayPicker calls onSelect after each click — `to` only lands once
    // the second day is picked, so this only commits (and closes the
    // popover) once the range is actually complete.
    if (range?.from && range?.to) {
      onChange(range.from, range.to)
      setIsOpen(false)
    }
  }

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
            <DayPicker
              mode="range"
              numberOfMonths={2}
              defaultMonth={startDate}
              selected={draftRange}
              onSelect={handleSelect}
              disabled={{ before: minDate, after: maxDate }}
              startMonth={minDate}
              endMonth={maxDate}
            />
          </div>
        </div>
      )}
    </div>
  )
}
