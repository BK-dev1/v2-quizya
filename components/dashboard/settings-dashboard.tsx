'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { useTheme } from "next-themes"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuInput } from "@/components/ui/neu-input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { User, Bell, Shield, Palette, Globe, Key, Camera, Check, Monitor, Mail, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

type SettingsTab = "profile" | "notifications" | "security" | "appearance" | "language"

interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  email: string
  institution: string | null
  department: string | null
  bio: string | null
  role: 'student' | 'teacher'
  created_at: string
  updated_at: string
}

interface NotificationSettings {
  email_exam_start: boolean
  email_submissions: boolean
  email_weekly_report: boolean
  push_exam_start: boolean
  push_infractions: boolean
  push_submissions: boolean
}

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Profile state
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    full_name: '',
    username: '',
    institution: '',
    department: '',
    bio: '',
  })

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_exam_start: true,
    email_submissions: true,
    email_weekly_report: false,
    push_exam_start: true,
    push_infractions: true,
    push_submissions: false,
  })

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")

  // Appearance state
  const [compactMode, setCompactMode] = useState(false)

  // Language state
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("America/New_York")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")

  useEffect(() => {
    if (user && profile) {
      loadUserSettings()
    }
  }, [user, profile])

  const loadUserSettings = async () => {
    setLoading(true)
    try {
      // Load profile data
      setUserProfile({
        full_name: profile?.full_name || '',
        username: profile?.username || '',
        institution: profile?.institution || '',
        department: profile?.department || '',
        bio: profile?.bio || '',
      })

      // Load notification settings (if they exist)
      const res = await fetch(`/api/settings/preferences?userId=${user?.id}`)
      if (res.ok) {
        const notificationData = await res.json()
        if (notificationData) {
          setNotifications({
            email_exam_start: notificationData.email_exam_start ?? true,
            email_submissions: notificationData.email_submissions ?? true,
            email_weekly_report: notificationData.email_weekly_report ?? false,
            push_exam_start: notificationData.push_exam_start ?? true,
            push_infractions: notificationData.push_infractions ?? true,
            push_submissions: notificationData.push_submissions ?? false,
          })
          setLanguage(notificationData.language || 'en')
          setTimezone(notificationData.timezone || 'America/New_York')
          setCompactMode(notificationData.compact_mode || false)
          setDateFormat(notificationData.date_format || 'MM/DD/YYYY')
          if (notificationData.theme) {
            setTheme(notificationData.theme)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return false

    setSaving(true)
    try {
      const res = await fetch(`/api/settings/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: userProfile.full_name,
          username: userProfile.username,
          institution: userProfile.institution,
          department: userProfile.department,
          bio: userProfile.bio,
          updated_at: new Date().toISOString(),
        })
      })

      if (!res.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully')
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async () => {
    if (!user) return false

    setSaving(true)
    try {
      const res = await fetch(`/api/settings/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_exam_start: notifications.email_exam_start,
          email_submissions: notifications.email_submissions,
          email_weekly_report: notifications.email_weekly_report,
          push_exam_start: notifications.push_exam_start,
          push_infractions: notifications.push_infractions,
          push_submissions: notifications.push_submissions,
          updated_at: new Date().toISOString(),
        })
      })

      if (!res.ok) throw new Error('Failed to save notifications')

      toast.success('Notification preferences saved')
      return true
    } catch (error) {
      console.error('Error saving notifications:', error)
      toast.error('Failed to save notification preferences')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveAppearance = async () => {
    if (!user) return false

    setSaving(true)
    try {
      const res = await fetch(`/api/settings/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compact_mode: compactMode,
          theme: theme || 'system',
          language,
          timezone,
          date_format: dateFormat,
          updated_at: new Date().toISOString(),
        })
      })

      if (!res.ok) throw new Error('Failed to save appearance')

      toast.success('Appearance preferences saved')
      return true
    } catch (error) {
      console.error('Error saving appearance:', error)
      toast.error('Failed to save appearance preferences')
      return false
    } finally {
      setSaving(false)
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

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "language" as const, label: "Language & Region", icon: Globe },
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <NeuCard className="lg:w-64 p-2 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap transition-all ${activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <tab.icon className="w-5 h-5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </NeuCard>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border border-border flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-bold text-primary">
                      {getInitials(userProfile.full_name ?? null)}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-foreground">{userProfile.full_name || 'No name set'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile?.role} Account</p>
                  <button className="text-sm text-primary hover:underline mt-1">Change avatar</button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <NeuInput
                  label="Full Name"
                  value={userProfile.full_name || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                />
                <NeuInput
                  label="Username"
                  value={userProfile.username || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 rounded-xl bg-muted/50 px-4 flex items-center text-muted-foreground text-sm">
                      {user.email}
                    </div>
                    <Link href="/dashboard/settings/change-email">
                      <NeuButton variant="secondary" size="sm">
                        Change
                      </NeuButton>
                    </Link>
                  </div>
                </div>
                <NeuInput
                  label="Institution"
                  value={userProfile.institution || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, institution: e.target.value })}
                />
                <NeuInput
                  label="Department"
                  value={userProfile.department || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                  <textarea
                    value={userProfile.bio || ''}
                    onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

              <div className="space-y-8">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { key: "email_exam_start", label: "Exam started", desc: "When students begin taking your exam" },
                      { key: "email_submissions", label: "Exam submissions", desc: "When students complete and submit" },
                      { key: "email_weekly_report", label: "Weekly summary", desc: "Performance digest every Monday" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof NotificationSettings]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-7 rounded-full bg-muted peer-checked:bg-primary/20 transition-colors" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { key: "push_exam_start", label: "Exam activity", desc: "Real-time exam start alerts" },
                      { key: "push_infractions", label: "Proctoring alerts", desc: "When infractions are detected" },
                      { key: "push_submissions", label: "Instant submissions", desc: "Immediate submission alerts" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof NotificationSettings]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-7 rounded-full bg-muted peer-checked:bg-primary/20 transition-colors" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>

              <div className="space-y-6">
                {/* Email Change */}
                <Link href="/dashboard/settings/change-email" className="block">
                  <div className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Email Address</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* Password Change */}
                <Link href="/dashboard/settings/change-password" className="block">
                  <div className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Password</h3>
                          <p className="text-sm text-muted-foreground">Update your password</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* Two-Factor Authentication */}
                <div className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorEnabled ? "Enabled via authenticator app" : "Add an extra layer of security"}
                      </p>
                    </div>
                    <NeuButton
                      variant={twoFactorEnabled ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    >
                      {twoFactorEnabled ? "Disable" : "Enable"}
                    </NeuButton>
                  </div>
                </div>

                {/* Session Timeout */}
                <div className="p-4 rounded-xl border border-border">
                  <h3 className="font-medium text-foreground mb-4">Session Timeout</h3>
                  <div className="flex flex-wrap gap-3">
                    {["15", "30", "60", "120"].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setSessionTimeout(mins)}
                        className={`px-4 py-2 rounded-xl transition-all ${sessionTimeout === mins
                          ? "bg-primary/10 text-primary font-medium border-2 border-primary"
                          : "border border-border hover:border-primary/50"
                          }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-4 rounded-xl border border-border">
                  <h3 className="font-medium text-foreground mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Current Browser Session</p>
                          <p className="text-xs text-muted-foreground">Active now</p>
                        </div>
                      </div>
                      <span className="text-xs text-success font-medium">Active</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 rounded-xl border-2 border-destructive/20">
                  <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data.
                  </p>
                  <NeuButton variant="destructive" size="sm">
                    Delete Account
                  </NeuButton>
                </div>
              </div>
            </NeuCard>
          )}

          {activeTab === "appearance" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Appearance</h2>

              <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Theme</h3>
                  <ThemeToggle variant="buttons" />
                </div>

                {/* Compact Mode */}
                <div className="p-4 rounded-xl border border-border">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <h3 className="font-medium text-foreground">Compact Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing and padding throughout the interface
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 rounded-full bg-muted peer-checked:bg-primary/20 transition-colors" />
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all" />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveAppearance} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Language Tab */}
          {activeTab === "language" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Language & Region</h2>

              <div className="space-y-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                {/* Timezone Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="Europe/Paris">Central European Time (CET)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                    <option value="Asia/Shanghai">China Standard Time (CST)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date Format</label>
                  <div className="flex flex-wrap gap-3">
                    {["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((format) => (
                      <button
                        key={format}
                        onClick={() => setDateFormat(format)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${dateFormat === format
                            ? "bg-primary/10 text-primary font-medium border-2 border-primary"
                            : "border border-border hover:border-primary/50"
                          }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveAppearance} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}
        </div>
      </div>
    </div>
  )
}