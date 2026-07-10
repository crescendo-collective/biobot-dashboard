import { useTheme } from '../../context/ThemeContext'
import './ThemeToggle.scss'

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
    </button>
  )
}
