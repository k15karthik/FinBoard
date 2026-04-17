import * as React from "react"
import { cn } from "@/lib/utils"

/* Animated rotating border button */
export function BorderButton({ children, className, onClick, disabled, type = "button", ...props }) {
  return (
    <div
      className={cn("relative inline-flex rounded-lg p-[1px] overflow-hidden", className)}
      style={{ display: 'inline-flex' }}
    >
      {/* Rotating conic gradient border */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: 'inherit',
          background: 'conic-gradient(from var(--angle, 0deg), var(--accent-purple), var(--accent-purple-bright), var(--accent-violet), var(--accent-purple))',
          animation: 'border-rotate 3s linear infinite',
          zIndex: 0,
        }}
      />
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 22px',
          borderRadius: '7px',
          background: 'var(--bg-base)',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none',
          letterSpacing: '0.01em',
          opacity: disabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
        {...props}
      >
        {children}
      </button>
    </div>
  )
}

export function ButtonBorderDemo() {
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '24px' }}>
      <BorderButton>Convene the Board</BorderButton>
      <BorderButton disabled>Deliberating...</BorderButton>
    </div>
  )
}

export default BorderButton
