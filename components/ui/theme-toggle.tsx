"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

interface ThemeToggleProps {
  variant?: "buttons" | "dropdown"
  className?: string
}

export function ThemeToggle({ variant = "buttons", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`grid grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl flex flex-col items-center gap-2 bg-muted/50 animate-pulse h-20" />
        ))}
      </div>
    )
  }

  if (variant === "buttons") {
    const options = [
      { id: "light", label: "Light", icon: Sun },
      { id: "dark", label: "Dark", icon: Moon },
      { id: "system", label: "System", icon: Monitor },
    ]

    return (
      <div className={`grid grid-cols-3 gap-4 ${className}`}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              theme === option.id
                ? "bg-primary/10 border-2 border-primary text-primary"
                : "border border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
            }`}
          >
            <option.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return null
}
