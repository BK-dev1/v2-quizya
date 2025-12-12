"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react"

export interface CredentialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

const CredentialInput = React.forwardRef<HTMLInputElement, CredentialInputProps>(
  ({ className, type, label, error, success, icon, showPasswordToggle, id, ...props }, ref) => {
    const inputId = React.useId()
    const effectiveId = id || inputId
    const [showPassword, setShowPassword] = React.useState(false)

    const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type

    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={effectiveId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
          <input
            type={inputType}
            id={effectiveId}
            className={cn(
              "flex h-14 w-full rounded-lg bg-input px-4 py-4 text-base text-foreground",
              "border border-border",
              "placeholder:text-muted-foreground/60",
              "transition-all duration-150 ease-out",
              "hover:border-muted-foreground/50",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-12",
              (showPasswordToggle || success || error) && "pr-12",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              success && "border-success focus:border-success focus:ring-success/20",
              className,
            )}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${effectiveId}-error` : undefined}
            {...props}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {success && !error && <Check className="w-5 h-5 text-success" aria-hidden="true" />}
            {error && <AlertCircle className="w-5 h-5 text-destructive" aria-hidden="true" />}
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p id={`${effectiveId}-error`} className="text-sm text-destructive flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)
CredentialInput.displayName = "CredentialInput"

export { CredentialInput }
