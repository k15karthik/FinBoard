import * as React from "react"
import { cn } from "@/lib/utils"

/* Primary CTA button — solid orange, white text, smooth hover */
export function BorderButton({ children, className, onClick, disabled, type = "button", ...props }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-1", className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 22px',
        borderRadius: '8px',
        background: disabled ? '#ECECEC' : hovered ? '#EA580C' : '#F97316',
        color: disabled ? '#9CA3AF' : 'white',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        letterSpacing: '0.01em',
        opacity: disabled ? 0.7 : 1,
        whiteSpace: 'nowrap',
        boxShadow: disabled
          ? 'none'
          : hovered
            ? '0 4px 12px rgba(249, 115, 22, 0.35)'
            : '0 2px 6px rgba(249, 115, 22, 0.2)',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'background 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export default BorderButton
