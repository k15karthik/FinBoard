import * as React from "react"
import { cn } from "@/lib/utils"

/* AnimatedButton — secondary action chip, orange on hover */
export function AnimatedButton({ label = "Submit", onClick, disabled, className, type = "button", ...props }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
        className
      )}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        background: disabled
          ? 'var(--bg-elevated)'
          : hovered
            ? 'rgba(249, 115, 22, 0.06)'
            : 'var(--bg-surface)',
        border: `1px solid ${disabled ? 'var(--border)' : hovered ? '#F97316' : 'var(--border)'}`,
        borderRadius: '8px',
        color: disabled ? 'var(--text-muted)' : hovered ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.01em',
        boxShadow: 'none',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        minWidth: '80px',
      }}
      {...props}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>
        {label}
      </span>
    </button>
  )
}

export default AnimatedButton
