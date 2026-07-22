import ThemeToggle from '@/components/ui/ThemeToggle'
import TimelineControls from '@/components/layout/TimelineControls/TimelineControls'
import './Header.scss'

export default function Header() {
  return (
    <header className="header">
      <TimelineControls />

      <div className="header-controls">
         <ThemeToggle />
      </div>
    </header>
  )
}
