import { useState } from 'react'
import ThemeToggle from '../ui/ThemeToggle'

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
        <ThemeToggle />
        <button className="menu-button" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </div>

      <style>{`
        .header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 32px;
          padding: 24px 40px;
        }
        .logo {
          display: flex;
          flex-direction: column;
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.05em;
          border: 1px solid var(--text-muted);
          padding: 6px 10px;
          line-height: 1.3;
          width: fit-content;
        }
        .scrubber {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 20px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }
        .scrubber-label {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.15em;
          color: var(--text);
        }
        .scrubber-track {
          position: relative;
          height: 24px;
          display: flex;
          align-items: center;
        }
        .scrubber-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border);
        }
        .scrubber-input {
          position: absolute;
          inset: 0;
          width: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }
        .scrubber-handle {
          position: absolute;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 24px;
          border: 1px solid var(--accent-cyan);
          color: var(--accent-cyan);
          font-family: var(--font-mono);
          font-size: 11px;
          background: var(--bg);
          pointer-events: none;
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .menu-button {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 26px;
        }
        .menu-button span {
          height: 1px;
          background: var(--text);
          width: 100%;
        }
        @media (max-width: 900px) {
          .header {
            grid-template-columns: auto auto;
            row-gap: 20px;
          }
          .scrubber {
            grid-column: 1 / -1;
            order: 3;
          }
        }
      `}</style>
    </header>
  )
}
