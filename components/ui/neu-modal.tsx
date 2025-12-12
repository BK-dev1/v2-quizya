"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface NeuModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  variant?: "default" | "warning" | "destructive"
  className?: string
}

export function NeuModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
  className,
}: NeuModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onClose])

  if (!open) return null

  const variantStyles = {
    default: "border-border",
    warning: "border-warning border-2",
    destructive: "border-destructive border-2",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md mx-4 bg-background rounded-2xl p-6 neu-card animate-in fade-in-0 zoom-in-95",
          variantStyles[variant],
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          </div>

          {children && <div>{children}</div>}

          {footer && <div className="flex justify-end gap-3 pt-4">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
