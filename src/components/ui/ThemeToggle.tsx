import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      className="theme-toggle"
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isLight ? '☀' : '☾'}
      </span>
      <span className="theme-toggle-track">
        <span
          className="theme-toggle-thumb"
          style={{ left: isLight ? '19px' : '2px' }}
        />
      </span>

      <style>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
        }
        .theme-toggle-icon {
          width: 16px;
          text-align: center;
          color: var(--text);
        }
        .theme-toggle-track {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 18px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface);
        }
        .theme-toggle-thumb {
          position: absolute;
          top: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent-cyan);
          transition: left 0.15s ease;
        }
      `}</style>
    </button>
  )
}
