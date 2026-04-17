import * as React from "react"
import { cn } from "@/lib/utils"

/* AnimatedButton — slide-up reveal label on hover */
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
        "relative overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 22px',
        background: disabled
          ? 'var(--bg-elevated)'
          : 'linear-gradient(135deg, var(--accent-violet), var(--accent-purple))',
        border: '1px solid transparent',
        borderRadius: '8px',
        color: disabled ? 'var(--text-muted)' : 'white',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.01em',
        boxShadow: disabled || !hovered
          ? 'none'
          : '0 0 28px rgba(124, 58, 237, 0.55)',
        transition: 'box-shadow 0.2s, opacity 0.2s',
        opacity: disabled ? 0.5 : 1,
        minWidth: '120px',
      }}
      {...props}
    >
      {/* Background shine sweep */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
          transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.5s ease',
          pointerEvents: 'none',
        }}
      />
      {/* Label */}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {label}
      </span>
    </button>
  )
}

export default AnimatedButton
