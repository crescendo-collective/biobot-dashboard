import { useCallback, useEffect, useRef, useState } from 'react'
import DateRangePicker from './DateRangePicker'
import {
  addWeeks,
  diffInWeeks,
  formatShortDate,
  formatWeekLabel,
  getWeekStart,
  isSameDay,
} from '@/utils/dateWeeks'
import './TimelineControls.scss'

// Placeholder bound for the "Total" preset and the earliest the range
// picker will let someone scroll back to — wire this to the real
// dataset's actual earliest observation date once that's known.
const MIN_AVAILABLE_DATE = new Date(2023, 0, 1)

export default function TimelineControls() {
  const today = useRef(new Date()).current
  const currentWeekStart = getWeekStart(today)

  const [rangeStart, setRangeStart] = useState<Date>(() => addWeeks(currentWeekStart, -25))
  const [rangeEnd, setRangeEnd] = useState<Date>(today)

  // BUG FIX: totalWeeks previously always measured from rangeStart to
  // *today* (currentWeekStart), completely ignoring rangeEnd — so
  // picking an earlier end date in the range picker had no visible
  // effect on the slider at all. It now spans to whatever rangeEnd
  // actually is.
  const totalWeeks = Math.max(1, diffInWeeks(getWeekStart(rangeStart), getWeekStart(rangeEnd)))
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(totalWeeks)

  // Changing the overall date range makes the previous handle position
  // potentially meaningless (or out of bounds) — jump back to the
  // current/latest week rather than trying to preserve a position that
  // may no longer make sense against the new range.
  useEffect(() => {
    setSelectedWeekIndex(totalWeeks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime()])

  const selectedWeekStart = addWeeks(getWeekStart(rangeStart), selectedWeekIndex)

  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const index = Math.round(ratio * totalWeeks)
      setSelectedWeekIndex(index)
    },
    [totalWeeks],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
    setIsDragging(true)
    updateFromClientX(event.clientX)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    updateFromClientX(event.clientX)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    ;(event.target as HTMLElement).releasePointerCapture(event.pointerId)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      setSelectedWeekIndex((i) => Math.max(0, i - 1))
    } else if (event.key === 'ArrowRight') {
      setSelectedWeekIndex((i) => Math.min(totalWeeks, i + 1))
    }
  }

  const handlePercent = totalWeeks === 0 ? 0 : (selectedWeekIndex / totalWeeks) * 100

  return (
    <div className="timeline-controls">
      <div className="timeline-controls-top">
        <DateRangePicker
          startDate={rangeStart}
          endDate={rangeEnd}
          minDate={MIN_AVAILABLE_DATE}
          maxDate={today}
          onChange={(start, end) => {
            setRangeStart(start)
            setRangeEnd(end)
          }}
        />

        <span className="timeline-week-label">
          WEEK: <strong>{formatWeekLabel(selectedWeekStart)}</strong>
        </span>
      </div>

      <div className="timeline-slider">
        <span className="timeline-slider-label">{formatShortDate(rangeStart)}</span>

        <div
          className="timeline-slider-track"
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="timeline-slider-line" />
          <div className="timeline-slider-ticks">
            {Array.from({ length: totalWeeks + 1 }, (_, i) => (
              <span key={i} className="timeline-slider-tick" />
            ))}
          </div>
          <div
            className="timeline-slider-handle"
            style={{ left: `${handlePercent}%` }}
            role="slider"
            tabIndex={0}
            aria-label="Select week"
            aria-valuemin={0}
            aria-valuemax={totalWeeks}
            aria-valuenow={selectedWeekIndex}
            aria-valuetext={formatWeekLabel(selectedWeekStart)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Reads "Current" only when the range genuinely ends today —
           an explicitly-picked earlier end date shows its real date
           instead, so this label doesn't lie about what's selected. */}
        <span className="timeline-slider-label">
          {isSameDay(rangeEnd, today) ? 'Current' : formatShortDate(rangeEnd)}
        </span>
      </div>
    </div>
  )
}
