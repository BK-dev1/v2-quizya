"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"
import { NeuButton } from "@/components/ui/neu-button"
import {
  LayoutDashboard,
  FileEdit,
  Database,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { useTranslation } from "react-i18next"

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/exams", label: "myExams", icon: FileEdit },
  { href: "/dashboard/question-bank", label: "questionBank", icon: Database },
  { href: "/dashboard/analytics", label: "analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const { t } = useTranslation()

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      toast.success(t('signedOutSuccessfully') || 'Signed out successfully')
      router.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error(t('failedToSignOut') || 'Failed to sign out')
    } finally {
      setSigningOut(false)
      setUserMenuOpen(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserDisplayName = () => {
    return profile?.full_name || profile?.username || user?.email?.split('@')[0] || t('user')
  }

  const getUserEmail = () => {
    return user?.email || t('noEmail') || 'No email'
  }

  // Show loading screen while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Q</span>
            </div>
            <span className="font-bold text-xl">Quizya</span>
          </Link>

          <button className="p-2 rounded-lg hover:bg-muted relative" aria-label="Notifications">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 rtl:right-0 top-0 bottom-0 w-72 bg-sidebar p-4 neu-card animate-in slide-in-from-left rtl:slide-in-from-right">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">Q</span>
                </div>
                <span className="font-bold text-xl">Quizya</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                    pathname === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground neu-button"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {t(item.label)}
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <NeuButton
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('signingOut')}
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    {t('logOut')}
                  </>
                )}
              </NeuButton>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 rtl:lg:right-0 rtl:lg:left-auto lg:flex lg:w-64 lg:flex-col bg-sidebar border-r rtl:border-l rtl:border-r-0 border-sidebar-border">
        <div className="flex flex-col flex-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Q</span>
            </div>
            <span className="font-bold text-xl">Quizya</span>
          </Link>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground neu-button"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="w-5 h-5" />
                {t(item.label)}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {getInitials(getUserDisplayName())}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{getUserEmail()}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", userMenuOpen && "rotate-180")} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-popover rounded-xl neu-card-sm">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {signingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('signingOut')}
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      {t('logOut')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 rtl:lg:pr-64 rtl:lg:pl-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 h-16 border-b border-border">
          <div>{/* Breadcrumb or page title could go here */}</div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-muted relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
