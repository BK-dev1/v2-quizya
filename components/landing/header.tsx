"use client"

import * as React from "react"
import Link from "next/link"
import { NeuButton } from "@/components/ui/neu-button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-xl">Quizya</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login">
            <NeuButton variant="ghost" size="sm">
              Log in
            </NeuButton>
          </Link>
          <Link href="/auth/signup">
            <NeuButton size="sm">Get Started</NeuButton>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/features"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <NeuButton variant="ghost" size="sm" className="w-full">
                  Log in
                </NeuButton>
              </Link>
              <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                <NeuButton size="sm" className="w-full">
                  Get Started
                </NeuButton>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
