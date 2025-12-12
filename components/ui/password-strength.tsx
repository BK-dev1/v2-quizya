"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" }

    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }

    if (checks.length) score++
    if (checks.lowercase && checks.uppercase) score++
    if (checks.number) score++
    if (checks.special) score++
    if (password.length >= 12) score++

    const levels = [
      { score: 0, label: "", color: "bg-muted" },
      { score: 1, label: "Weak", color: "bg-red-500" },
      { score: 2, label: "Fair", color: "bg-orange-500" },
      { score: 3, label: "Good", color: "bg-yellow-500" },
      { score: 4, label: "Strong", color: "bg-green-500" },
      { score: 5, label: "Excellent", color: "bg-emerald-500" },
    ]

    const level = levels[Math.min(score, 5)]
    return { score, label: level.label, color: level.color, checks }
  }, [password])

  if (!password) return null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i <= strength.score ? strength.color : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span
          className={cn(
            "text-xs font-medium transition-colors",
            strength.score <= 1 && "text-red-500",
            strength.score === 2 && "text-orange-500",
            strength.score === 3 && "text-yellow-600",
            strength.score >= 4 && "text-green-500",
          )}
        >
          {strength.label}
        </span>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className={cn(strength.checks?.length && "text-green-500")}>8+ chars</span>
          <span className={cn(strength.checks?.uppercase && strength.checks?.lowercase && "text-green-500")}>Aa</span>
          <span className={cn(strength.checks?.number && "text-green-500")}>123</span>
          <span className={cn(strength.checks?.special && "text-green-500")}>@#$</span>
        </div>
      </div>
    </div>
  )
}
