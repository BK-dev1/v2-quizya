"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}

const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-100 ease-out rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      primary: "bg-primary text-primary-foreground neu-button hover:brightness-105 active:neu-pressed",
      secondary: "bg-background text-foreground neu-button hover:brightness-102 active:neu-pressed",
      ghost: "bg-transparent text-foreground hover:bg-muted/50 active:bg-muted",
      destructive: "bg-destructive text-destructive-foreground neu-button hover:brightness-105 active:neu-pressed",
    }

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    }

    return (
      <button className={cn(baseStyles, variants[variant], sizes[size], className)} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
NeuButton.displayName = "NeuButton"

export { NeuButton }
