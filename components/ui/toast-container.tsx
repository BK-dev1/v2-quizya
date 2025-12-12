"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info" | "loading"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }

    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  }

  const colors = {
    success: "border-l-green-500 bg-green-50",
    error: "border-l-red-500 bg-red-50",
    warning: "border-l-yellow-500 bg-yellow-50",
    info: "border-l-primary bg-primary/5",
    loading: "border-l-primary bg-primary/5",
  }

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-600",
    info: "text-primary",
    loading: "text-primary animate-spin",
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-l-4 shadow-lg",
                "animate-in slide-in-from-right-full duration-300",
                colors[toast.type],
              )}
              role="alert"
            >
              <Icon className={cn("w-5 h-5 shrink-0", iconColors[toast.type])} />
              <p className="flex-1 text-sm text-foreground">{toast.message}</p>
              {toast.type !== "loading" && (
                <button
                  onClick={() => hideToast(toast.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
