"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Copy, Check, QrCode } from "lucide-react"
import { NeuButton } from "./neu-button"

export interface RoomCodeWidgetProps {
  roomCode: string
  qrCodeUrl?: string
  showQR?: boolean
  onToggleQR?: () => void
  className?: string
}

export function RoomCodeWidget({ roomCode, qrCodeUrl, showQR = false, onToggleQR, className }: RoomCodeWidgetProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Room Code</span>
        {onToggleQR && (
          <button
            onClick={onToggleQR}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showQR ? "Hide QR code" : "Show QR code"}
          >
            <QrCode className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 px-4 py-3 bg-background rounded-xl neu-inset">
          <span className="font-mono text-2xl font-bold tracking-widest">{roomCode}</span>
        </div>
        <NeuButton
          variant="secondary"
          size="md"
          onClick={handleCopy}
          aria-label={copied ? "Copied!" : "Copy room code"}
        >
          {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
        </NeuButton>
      </div>

      {showQR && qrCodeUrl && (
        <div className="flex justify-center p-4 bg-white rounded-xl neu-flat">
          <img src={qrCodeUrl || "/placeholder.svg"} alt="QR code to join exam" className="w-40 h-40" />
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">Share this code with students to join the exam</p>
    </div>
  )
}
