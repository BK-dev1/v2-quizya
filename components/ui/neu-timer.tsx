"use client"
import { cn } from "@/lib/utils"

export interface NeuTimerProps {
  totalSeconds: number
  remainingSeconds: number
  variant?: "circular" | "linear"
  showWarning?: boolean
  className?: string
}

export function NeuTimer({
  totalSeconds,
  remainingSeconds,
  variant = "circular",
  showWarning = false,
  className,
}: NeuTimerProps) {
  const percentage = (remainingSeconds / totalSeconds) * 100
  const isLowTime = remainingSeconds <= 300 // 5 minutes

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (variant === "linear") {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Time Remaining</span>
          <span className={cn("font-mono font-semibold", isLowTime && "text-destructive timer-warning")}>
            {formatTime(remainingSeconds)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-secondary border border-border overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              isLowTime ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={remainingSeconds}
            aria-valuemin={0}
            aria-valuemax={totalSeconds}
            aria-label={`${formatTime(remainingSeconds)} remaining`}
          />
        </div>
      </div>
    )
  }

  // Circular variant
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle className="text-secondary stroke-current" strokeWidth="8" fill="none" r="45" cx="50" cy="50" />
        {/* Progress circle */}
        <circle
          className={cn("stroke-current transition-all duration-1000", isLowTime ? "text-destructive" : "text-primary")}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          r="45"
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-xl font-mono font-bold", isLowTime && "text-destructive timer-warning")}>
          {formatTime(remainingSeconds)}
        </span>
        {showWarning && isLowTime && <span className="text-xs text-destructive font-medium">Low Time!</span>}
      </div>
    </div>
  )
}
