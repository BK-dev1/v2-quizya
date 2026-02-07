"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: "sm" | "md" | "lg"
}

const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 ease-out rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

    const variants = {
      primary:
        "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:shadow-sm active:translate-y-0",
      secondary:
        "bg-secondary text-secondary-foreground border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 active:shadow-none active:translate-y-0",
      ghost: "bg-transparent text-foreground hover:bg-secondary active:bg-secondary/80",
      destructive:
        "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:shadow-sm active:translate-y-0",
      outline:
        "border-2 border-border bg-background hover:bg-secondary hover:text-secondary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
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
