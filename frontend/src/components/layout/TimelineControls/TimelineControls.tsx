import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  addWeeks,
  diffInWeeks,
  formatShortDate,
  formatWeekLabel,
  getWeekEnd,
  getWeekStart,
} from '@/utils/dateWeeks'
import type { TimelineDateRange } from '@/types/timeline'
import './TimelineControls.scss'

interface TimelineControlsProps {
  onSelectedDateChange: (range: TimelineDateRange) => void
}

export default function TimelineControls({ onSelectedDateChange }: TimelineControlsProps) {
  const today = useRef(new Date()).current
  // Keep the range stable for this mounted dashboard. Recreating this Date on
  // every render would also retrigger the map-selection effect below.
  const rangeStart = useRef(addMonths(today, -3)).current
  const rangeEnd = today
  const totalWeeks = Math.max(1, diffInWeeks(getWeekStart(rangeStart), getWeekStart(rangeEnd)))
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(totalWeeks)
  const selectedWeekStart = useMemo(
    () => addWeeks(getWeekStart(rangeStart), selectedWeekIndex),
    [rangeStart, selectedWeekIndex],
  )

  useEffect(() => {
    onSelectedDateChange({ start: selectedWeekStart, end: getWeekEnd(selectedWeekStart) })
  }, [onSelectedDateChange, selectedWeekStart])

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

        <span className="timeline-slider-label">Current</span>
      </div>
    </div>
  )
}
