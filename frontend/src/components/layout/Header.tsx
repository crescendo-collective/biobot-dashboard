import ThemeToggle from '@/components/ui/ThemeToggle'
import TimelineControls from '@/components/layout/TimelineControls/TimelineControls'
import type { TimelineDateRange } from '@/types/timeline'
import './Header.scss'

interface HeaderProps {
  onSelectedDateChange: (range: TimelineDateRange) => void
}

export default function Header({ onSelectedDateChange }: HeaderProps) {
  return (
    <header className="header">
      <TimelineControls onSelectedDateChange={onSelectedDateChange} />

      <div className="header-controls">
         <ThemeToggle />
      </div>
    </header>
  )
}
