import * as React from "react"
import { Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_LINKS = [
  { label: 'Chat',      href: '#' },
  { label: 'Dashboard', href: '#' },
  { label: 'History',   href: '#' },
]

export function SimpleHeader({
  links = DEFAULT_LINKS,
  onNavigate,
  activeLink,
  isLoading,
  error,
  className,
}) {
  return (
    <header
      className={cn("simple-header", className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: '56px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)',
          flexShrink: 0,
        }}>
          <Zap size={13} color="white" aria-hidden="true" />
        </div>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          FinBoard
        </span>
      </div>

      {/* Nav links */}
      <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {links.map(({ label, href }) => {
          const isActive = activeLink === label.toLowerCase()
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate?.(label.toLowerCase())}
              style={{
                background: isActive ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* Right status area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px', justifyContent: 'flex-end' }}>
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: 'var(--accent-primary)',
            }}
          >
            <Loader2 size={13} className="spin" aria-hidden="true" />
            Deliberating
          </div>
        )}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: 'var(--accent-red)',
              padding: '3px 10px',
              background: 'rgba(220, 38, 38, 0.06)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: '5px',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={error}
          >
            {error}
          </div>
        )}
        {!isLoading && !error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-green)',
              display: 'inline-block',
            }} />
            Ready
          </div>
        )}
      </div>
    </header>
  )
}

export default SimpleHeader
