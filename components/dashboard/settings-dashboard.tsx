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
import { useTranslation } from 'react-i18next';

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
  const { i18n, t } = useTranslation();

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

      // Load user settings
      const res = await fetch(`/api/settings/preferences`)

      if (res.ok) {
        const settingsData = await res.json()

        if (settingsData && Object.keys(settingsData).length > 0) {
          // Set notification settings
          setNotifications({
            email_exam_start: settingsData.email_exam_start ?? true,
            email_submissions: settingsData.email_submissions ?? true,
            email_weekly_report: settingsData.email_weekly_report ?? false,
            push_exam_start: settingsData.push_exam_start ?? true,
            push_infractions: settingsData.push_infractions ?? true,
            push_submissions: settingsData.push_submissions ?? false,
          })

          // Set language and other settings
          const savedLanguage = settingsData.language || 'en'
          setLanguage(savedLanguage)
          setTimezone(settingsData.timezone || 'America/New_York')
          setCompactMode(settingsData.compact_mode || false)
          setDateFormat(settingsData.date_format || 'MM/DD/YYYY')
          setTwoFactorEnabled(settingsData.two_factor_enabled || false)
          setSessionTimeout(String(settingsData.session_timeout_minutes || "30"))

          // Apply saved language immediately
          if (savedLanguage !== i18n.language) {
            await i18n.changeLanguage(savedLanguage)
          }

          // Apply theme if different
          if (settingsData.theme && settingsData.theme !== theme) {
            setTheme(settingsData.theme)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      toast.error(t('loadSettingsFailed') || 'Failed to load settings')
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
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || t('profileUpdateFailed') || 'Failed to update profile')
      }

      toast.success(t('profileUpdated') || 'Profile updated successfully')
      return true
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message)
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
        })
      })

      if (!res.ok) {
        throw new Error(t('notificationsSaveFailed') || 'Failed to save notifications')
      }

      toast.success(t('notificationsSaved') || 'Notification preferences saved')
      return true
    } catch (error: any) {
      console.error('Error saving notifications:', error)
      toast.error(error.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveAppearance = async () => {
    if (!user) return false

    setSaving(true)
    try {
      const requestBody = {
        compact_mode: compactMode,
        theme: theme || 'system',
        language: language,
        timezone: timezone,
        date_format: dateFormat,
      }

      const res = await fetch(`/api/settings/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!res.ok) {
        throw new Error(t('appearanceSaveFailed') || 'Failed to save appearance')
      }

      // Apply language change immediately
      await i18n.changeLanguage(language)

      toast.success(t('appearanceSaved') || 'Appearance & Region preferences saved')
      return true
    } catch (error: any) {
      console.error('Error saving appearance:', error)
      toast.error(error.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveSecurity = async () => {
    if (!user) return false

    setSaving(true)
    try {
      const res = await fetch(`/api/settings/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_timeout_minutes: parseInt(sessionTimeout),
          two_factor_enabled: twoFactorEnabled,
        })
      })

      if (!res.ok) {
        throw new Error(t('securitySaveFailed') || 'Failed to save security settings')
      }

      toast.success(t('securitySaved') || 'Security settings saved')
      return true
    } catch (error: any) {
      console.error('Error saving security:', error)
      toast.error(error.message)
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
    { id: "profile" as const, label: t('profile') || "Profile", icon: User },
    { id: "notifications" as const, label: t('notifications') || "Notifications", icon: Bell },
    { id: "security" as const, label: t('security') || "Security", icon: Shield },
    { id: "appearance" as const, label: t('appearance') || "Appearance", icon: Palette },
    { id: "language" as const, label: t('languageRegion') || "Language & Region", icon: Globe },
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('pleaseLogin') || 'Please log in to access settings.'}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('loadingSettings') || 'Loading settings...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('settings') || 'Settings'}</h1>
        <p className="text-muted-foreground mt-1">{t('managePreferences') || 'Manage your account preferences'}</p>
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
              <h2 className="text-xl font-semibold mb-6">{t('profileInformation') || 'Profile Information'}</h2>

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
                  <p className="font-medium text-foreground">{userProfile.full_name || t('noNameSet') || 'No name set'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile?.role} {t('account') || 'Account'}</p>
                  <button className="text-sm text-primary hover:underline mt-1">{t('changeAvatar') || 'Change avatar'}</button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <NeuInput
                  label={t('fullName') || "Full Name"}
                  value={userProfile.full_name || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                />
                <NeuInput
                  label={t('username') || "Username"}
                  value={userProfile.username || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">{t('emailAddress') || 'Email Address'}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 rounded-xl bg-muted/50 px-4 flex items-center text-muted-foreground text-sm">
                      {user.email}
                    </div>
                    <Link href="/dashboard/settings/change-email">
                      <NeuButton variant="secondary" size="sm">
                        {t('change') || 'Change'}
                      </NeuButton>
                    </Link>
                  </div>
                </div>
                <NeuInput
                  label={t('institution') || "Institution"}
                  value={userProfile.institution || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, institution: e.target.value })}
                />
                <NeuInput
                  label={t('department') || "Department"}
                  value={userProfile.department || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t('bio') || 'Bio'}</label>
                  <textarea
                    value={userProfile.bio || ''}
                    onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder={t('bioPlaceholder') || "Tell us about yourself..."}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    t('saveChanges') || "Save Changes"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">{t('notificationPreferences') || 'Notification Preferences'}</h2>

              <div className="space-y-8">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">{t('emailNotifications') || 'Email Notifications'}</h3>
                  <div className="space-y-4">
                    {[
                      { key: "email_exam_start", label: t('examStarted') || "Exam started", desc: t('examStartedDesc') || "When students begin taking your exam" },
                      { key: "email_submissions", label: t('examSubmissions') || "Exam submissions", desc: t('examSubmissionsDesc') || "When students complete and submit" },
                      { key: "email_weekly_report", label: t('weeklySummary') || "Weekly summary", desc: t('weeklySummaryDesc') || "Performance digest every Monday" },
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
                  <h3 className="font-medium text-foreground mb-4">{t('pushNotifications') || 'Push Notifications'}</h3>
                  <div className="space-y-4">
                    {[
                      { key: "push_exam_start", label: t('examActivity') || "Exam activity", desc: t('examActivityDesc') || "Real-time exam start alerts" },
                      { key: "push_infractions", label: t('proctoringAlerts') || "Proctoring alerts", desc: t('proctoringAlertsDesc') || "When infractions are detected" },
                      { key: "push_submissions", label: t('instantSubmissions') || "Instant submissions", desc: t('instantSubmissionsDesc') || "Immediate submission alerts" },
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
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    t('savePreferences') || "Save Preferences"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">{t('securitySettings') || 'Security Settings'}</h2>

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
                          <h3 className="font-medium text-foreground">{t('emailAddress') || 'Email Address'}</h3>
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
                          <h3 className="font-medium text-foreground">{t('password') || 'Password'}</h3>
                          <p className="text-sm text-muted-foreground">{t('updatePassword') || 'Update your password'}</p>
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
                      <h3 className="font-medium text-foreground">{t('twoFactorAuth') || 'Two-Factor Authentication'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorEnabled ? t('twoFactorEnabled') || "Enabled via authenticator app" : t('twoFactorDisabled') || "Add an extra layer of security"}
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 rounded-full bg-muted peer-checked:bg-primary/20 transition-colors" />
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Session Timeout */}
                <div className="p-4 rounded-xl border border-border">
                  <h3 className="font-medium text-foreground mb-4">{t('sessionTimeout') || 'Session Timeout'}</h3>
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
                        {mins} {t('min') || 'min'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-4 rounded-xl border border-border">
                  <h3 className="font-medium text-foreground mb-4">{t('activeSessions') || 'Active Sessions'}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{t('currentBrowserSession') || 'Current Browser Session'}</p>
                          <p className="text-xs text-muted-foreground">{t('activeNow') || 'Active now'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-success font-medium">{t('active') || 'Active'}</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 rounded-xl border-2 border-destructive/20">
                  <h3 className="font-medium text-destructive mb-2">{t('dangerZone') || 'Danger Zone'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('deleteAccountWarning') || 'Permanently delete your account and all associated data.'}
                  </p>
                  <NeuButton variant="destructive" size="sm">
                    {t('deleteAccount') || 'Delete Account'}
                  </NeuButton>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={saveSecurity} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    t('saveChanges') || "Save Changes"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {activeTab === "appearance" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">{t('appearance') || 'Appearance'}</h2>

              <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">{t('theme') || 'Theme'}</h3>
                  <ThemeToggle variant="buttons" />
                </div>

                {/* Compact Mode */}
                <div className="p-4 rounded-xl border border-border">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <h3 className="font-medium text-foreground">{t('compactMode') || 'Compact Mode'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('compactModeDesc') || 'Reduce spacing and padding throughout the interface'}
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
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    t('savePreferences') || "Save Preferences"
                  )}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          {/* Language Tab */}
          {activeTab === "language" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">{t('languageRegion') || 'Language & Region'}</h2>

              <div className="space-y-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('language') || 'Language'}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                {/* Timezone Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('timezone') || 'Timezone'}</label>
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
                  <label className="block text-sm font-medium text-foreground mb-2">{t('dateFormat') || 'Date Format'}</label>
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
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    t('savePreferences') || "Save Preferences"
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