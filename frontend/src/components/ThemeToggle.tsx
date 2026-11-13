import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useTheme, type Theme } from '../context/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showDropdown?: boolean
  variant?: 'compact' | 'segmented'
}

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
]

const ThemeToggle = memo(function ThemeToggle({
  className = '',
  showDropdown = true,
  variant = 'compact',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  const getTooltipLabel = () => {
    if (theme === 'system') {
      return `Theme: System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
    }
    return `Theme: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}`
  }

  // Segmented Pill Variant (e.g. for Mobile Nav drawer)
  if (variant === 'segmented') {
    return (
      <div
        className={`theme-segmented-group ${className}`}
        role="radiogroup"
        aria-label="Select website theme"
      >
        {themeOptions.map((option) => {
          const OptionIcon = option.icon
          const isSelected = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`theme-segmented-btn ${isSelected ? 'theme-segmented-btn--active' : ''}`}
              onClick={() => setTheme(option.value)}
            >
              <OptionIcon size={14} className="segmented-icon" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Compact Variant with animated icon and floating popover/dropdown
  return (
    <div
      ref={containerRef}
      className={`theme-toggle-wrapper ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false)
      }}
    >
      <button
        type="button"
        className={`theme-toggle-btn ${dropdownOpen ? 'theme-toggle-btn--active' : ''}`}
        onClick={toggleTheme}
        onContextMenu={(e) => {
          if (showDropdown) {
            e.preventDefault()
            setDropdownOpen((open) => !open)
          }
        }}
        aria-label={`Current theme is ${theme}. Click to switch theme, or right click for options.`}
        aria-haspopup={showDropdown ? 'menu' : undefined}
        aria-expanded={showDropdown ? dropdownOpen : undefined}
        title={getTooltipLabel()}
      >
        <span className="theme-icon-container" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            {resolvedTheme === 'dark' ? (
              <motion.span
                key="dark-icon"
                className="theme-icon-motion"
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotate: -45, scale: 0.6 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, rotate: 0, scale: 1 }
                }
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotate: 45, scale: 0.6 }
                }
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Moon size={17} className="text-amber-300" />
              </motion.span>
            ) : (
              <motion.span
                key="light-icon"
                className="theme-icon-motion"
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotate: 45, scale: 0.6 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, rotate: 0, scale: 1 }
                }
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotate: -45, scale: 0.6 }
                }
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Sun size={17} className="text-amber-500" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        {theme === 'system' && (
          <span
            className="theme-system-indicator"
            aria-hidden="true"
            title="Auto following system preference"
          />
        )}
      </button>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {showTooltip && !dropdownOpen && (
          <motion.div
            className="theme-tooltip"
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <span>{getTooltipLabel()}</span>
            <span className="tooltip-hint">&bull; Click to switch theme</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Selection Dropdown Menu */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            className="theme-dropdown-menu"
            role="menu"
            aria-label="Theme options"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="theme-dropdown-heading">Appearance</div>
            {themeOptions.map((option) => {
              const OptionIcon = option.icon
              const isSelected = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitem"
                  className={`theme-dropdown-item ${isSelected ? 'theme-dropdown-item--selected' : ''}`}
                  onClick={() => {
                    setTheme(option.value)
                    setDropdownOpen(false)
                  }}
                >
                  <OptionIcon size={14} className="dropdown-item-icon" />
                  <span className="dropdown-item-label">{option.label}</span>
                  {isSelected && (
                    <Check size={13} className="dropdown-check-icon" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default ThemeToggle
