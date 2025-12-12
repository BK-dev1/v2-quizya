"use client"
import { cn } from "@/lib/utils"
import { Shield, AlertTriangle, Eye, EyeOff } from "lucide-react"

export interface ProctoringBadgeProps {
  isActive: boolean
  infractions?: number
  variant?: "compact" | "full"
  className?: string
}

export function ProctoringBadge({ isActive, infractions = 0, variant = "compact", className }: ProctoringBadgeProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          className,
        )}
      >
        <Shield className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Proctoring: {isActive ? "Active" : "Inactive"}</span>
        {infractions > 0 && (
          <span className="flex items-center justify-center w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs">
            {infractions}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("p-4 rounded-xl bg-background neu-flat space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
          <span className="font-medium">Proctoring</span>
        </div>
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {isActive && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Fullscreen mode required</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <EyeOff className="w-4 h-4" aria-hidden="true" />
            <span>Copy/paste disabled</span>
          </div>
          {infractions > 0 && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>
                {infractions} infraction{infractions > 1 ? "s" : ""} recorded
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
