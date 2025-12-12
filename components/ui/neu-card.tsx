import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "raised" | "flat" | "inset"
}

const NeuCard = React.forwardRef<HTMLDivElement, NeuCardProps>(
  ({ className, variant = "raised", children, ...props }, ref) => {
    const variants = {
      raised: "neu-card",
      flat: "neu-flat",
      inset: "neu-inset",
    }

    return (
      <div ref={ref} className={cn("rounded-2xl bg-background p-6", variants[variant], className)} {...props}>
        {children}
      </div>
    )
  },
)
NeuCard.displayName = "NeuCard"

const NeuCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />
  ),
)
NeuCardHeader.displayName = "NeuCardHeader"

const NeuCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
NeuCardTitle.displayName = "NeuCardTitle"

const NeuCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
NeuCardDescription.displayName = "NeuCardDescription"

const NeuCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
)
NeuCardContent.displayName = "NeuCardContent"

const NeuCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />,
)
NeuCardFooter.displayName = "NeuCardFooter"

export { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent, NeuCardFooter }
