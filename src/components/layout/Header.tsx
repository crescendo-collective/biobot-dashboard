import { useState } from 'react'
// Theme switching is on hold for now — re-enable by uncommenting this
// import and the <ThemeToggle /> usage below.
// import ThemeToggle from '../ui/ThemeToggle'
import './Header.scss'

export default function Header() {
  // 0 = full PAST, 100 = full FUTURE. Wire this up to actually
  // shift the map's data window once real data is connected.
  const [scrub, setScrub] = useState<number>(50)

  return (
    <header className="header">
      <div className="logo">
        <span>BIO</span>
        <span>BOT</span>
      </div>

      <div className="scrubber">
        <span className="scrubber-label">PAST</span>
        <div className="scrubber-track">
          <input
            type="range"
            min={0}
            max={100}
            value={scrub}
            onChange={(e) => setScrub(Number(e.target.value))}
            className="scrubber-input"
            aria-label="Timeline: past to future"
          />
          <div className="scrubber-line" />
          <div className="scrubber-handle" style={{ left: `${scrub}%` }}>
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
        </div>
        <span className="scrubber-label">FUTURE</span>
      </div>

      <div className="header-controls">
        {/* <ThemeToggle /> */}
        <button className="menu-button" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
