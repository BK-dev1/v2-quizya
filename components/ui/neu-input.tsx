"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const NeuInput = React.forwardRef<HTMLInputElement, NeuInputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = React.useId() // Moved useId hook to the top level
    const effectiveId = id || inputId

    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={effectiveId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          type={type}
          id={effectiveId}
          className={cn(
            "flex h-12 w-full rounded-xl bg-background px-4 py-3 text-base",
            "neu-input placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-2 ring-destructive",
            className,
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${effectiveId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${effectiveId}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)
NeuInput.displayName = "NeuInput"

export { NeuInput }
