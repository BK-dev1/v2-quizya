"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const NeuInput = React.forwardRef<HTMLInputElement, NeuInputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = React.useId()
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
            "flex h-12 w-full rounded-lg bg-input px-4 py-3 text-base",
            "border border-border placeholder:text-muted-foreground",
            "transition-all duration-150 ease-out",
            "hover:border-muted-foreground/50",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
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
