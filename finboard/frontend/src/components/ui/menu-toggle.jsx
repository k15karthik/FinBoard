import * as React from "react"
import { cn } from "@/lib/utils"

export function MenuToggle({ isOpen, onToggle, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      style={{
        background: isOpen ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
        border: '1px solid',
        borderColor: isOpen ? 'var(--accent-purple)' : 'var(--border-bright)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '16px',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '1.5px',
            background: 'currentColor',
            borderRadius: '1px',
            transformOrigin: 'center',
            transition: 'transform 0.25s ease, opacity 0.25s ease',
            transform: isOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
          }}
        />
        <span
          style={{
            display: 'block',
            height: '1.5px',
            background: 'currentColor',
            borderRadius: '1px',
            transition: 'opacity 0.25s ease',
            opacity: isOpen ? 0 : 1,
          }}
        />
        <span
          style={{
            display: 'block',
            height: '1.5px',
            background: 'currentColor',
            borderRadius: '1px',
            transformOrigin: 'center',
            transition: 'transform 0.25s ease, opacity 0.25s ease',
            transform: isOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
          }}
        />
      </div>
    </button>
  )
}

export default MenuToggle
