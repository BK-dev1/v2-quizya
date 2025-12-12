"use client"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface NeuToastProps {
  message: string
  variant?: ToastVariant
  onDismiss?: () => void
  className?: string
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: "border-l-4 border-l-success",
  error: "border-l-4 border-l-destructive",
  warning: "border-l-4 border-l-warning",
  info: "border-l-4 border-l-primary",
}

export function NeuToast({ message, variant = "info", onDismiss, className }: NeuToastProps) {
  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn("flex items-center gap-3 p-4 bg-background rounded-xl neu-card-sm", styles[variant], className)}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          variant === "success" && "text-success",
          variant === "error" && "text-destructive",
          variant === "warning" && "text-warning",
          variant === "info" && "text-primary",
        )}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
