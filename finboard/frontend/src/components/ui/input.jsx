import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-bright)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
      }}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
