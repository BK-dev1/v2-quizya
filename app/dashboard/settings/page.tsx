"use client"

import { useState } from "react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuInput } from "@/components/ui/neu-input"
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Camera,
  Check,
  Sun,
  Moon,
  Monitor,
  Mail,
  ChevronRight,
} from "lucide-react"

type SettingsTab = "profile" | "notifications" | "security" | "appearance" | "language"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [saved, setSaved] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    institution: "State University",
    department: "Computer Science",
    bio: "Professor of Computer Science with 10+ years of teaching experience.",
  })

  // Notification state
  const [notifications, setNotifications] = useState({
    emailExamStart: true,
    emailSubmissions: true,
    emailWeeklyReport: false,
    pushExamStart: true,
    pushInfractions: true,
    pushSubmissions: false,
  })

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")

  // Appearance state
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [compactMode, setCompactMode] = useState(false)

  // Language state
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("America/New_York")

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "language" as const, label: "Language & Region", icon: Globe },
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "neu-inset text-primary font-medium"
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
                  <div className="w-24 h-24 rounded-full neu-raised flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-bold text-primary">SJ</span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full neu-button bg-background flex items-center justify-center hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">Teacher Account</p>
                  <button className="text-sm text-primary hover:underline mt-1">Change avatar</button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <NeuInput
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 rounded-xl bg-muted/50 px-4 flex items-center text-muted-foreground text-sm">
                      {profile.email}
                    </div>
                    <Link href="/dashboard/settings/change-email">
                      <NeuButton variant="secondary" size="sm">
                        Change
                      </NeuButton>
                    </Link>
                  </div>
                </div>
                {/* End change */}
                <NeuInput
                  label="Institution"
                  value={profile.institution}
                  onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                />
                <NeuInput
                  label="Department"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl neu-inset bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={handleSave}>
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Saved
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
                      { key: "emailExamStart", label: "Exam started", desc: "When students begin taking your exam" },
                      { key: "emailSubmissions", label: "Exam submissions", desc: "When students complete and submit" },
                      { key: "emailWeeklyReport", label: "Weekly summary", desc: "Performance digest every Monday" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl neu-flat cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-7 rounded-full neu-inset peer-checked:bg-primary/20 transition-colors" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all neu-raised" />
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
                      { key: "pushExamStart", label: "Exam activity", desc: "Real-time exam start alerts" },
                      { key: "pushInfractions", label: "Proctoring alerts", desc: "When infractions are detected" },
                      { key: "pushSubmissions", label: "Instant submissions", desc: "Immediate submission alerts" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl neu-flat cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-7 rounded-full neu-inset peer-checked:bg-primary/20 transition-colors" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all neu-raised" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={handleSave}>
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Saved
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
                  <div className="p-4 rounded-xl neu-flat hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Email Address</h3>
                          <p className="text-sm text-muted-foreground">sarah.johnson@university.edu</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* Password Change */}
                <Link href="/dashboard/settings/change-password" className="block">
                  <div className="p-4 rounded-xl neu-flat hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Password</h3>
                          <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
                {/* End change */}

                {/* Two-Factor Authentication */}
                <div className="p-4 rounded-xl neu-flat">
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
                <div className="p-4 rounded-xl neu-flat">
                  <h3 className="font-medium text-foreground mb-4">Session Timeout</h3>
                  <div className="flex flex-wrap gap-3">
                    {["15", "30", "60", "120"].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setSessionTimeout(mins)}
                        className={`px-4 py-2 rounded-xl transition-all ${
                          sessionTimeout === mins ? "neu-inset text-primary font-medium" : "neu-button hover:scale-105"
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-4 rounded-xl neu-flat">
                  <h3 className="font-medium text-foreground mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg neu-raised flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Chrome on MacOS</p>
                          <p className="text-xs text-muted-foreground">Current session - New York, US</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg neu-raised flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Safari on iPhone</p>
                          <p className="text-xs text-muted-foreground">Last active 2 hours ago</p>
                        </div>
                      </div>
                      <button className="text-xs text-destructive hover:underline">Revoke</button>
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

          {/* Appearance Tab - unchanged */}
          {activeTab === "appearance" && (
            <NeuCard className="p-6">
              <h2 className="text-xl font-semibold mb-6">Appearance</h2>

              <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light" as const, label: "Light", icon: Sun },
                      { id: "dark" as const, label: "Dark", icon: Moon },
                      { id: "system" as const, label: "System", icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                          theme === option.id ? "neu-inset text-primary" : "neu-button hover:scale-105"
                        }`}
                      >
                        <option.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Mode */}
                <div className="p-4 rounded-xl neu-flat">
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
                      <div className="w-12 h-7 rounded-full neu-inset peer-checked:bg-primary/20 transition-colors" />
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-muted-foreground peer-checked:bg-primary peer-checked:translate-x-5 transition-all neu-raised" />
                    </div>
                  </label>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Preview</h3>
                  <div className="p-6 rounded-xl neu-inset">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full neu-raised bg-primary/10" />
                      <div className="flex-1">
                        <div className="h-4 w-32 rounded neu-flat mb-2" />
                        <div className="h-3 w-24 rounded neu-flat" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 rounded neu-flat w-full" />
                      <div className="h-3 rounded neu-flat w-4/5" />
                      <div className="h-3 rounded neu-flat w-3/5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={handleSave}>
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Saved
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
                    className="w-full h-12 px-4 rounded-xl neu-inset bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="en">English (US)</option>
                    <option value="en-gb">English (UK)</option>
                    <option value="es">Espanol</option>
                    <option value="fr">Francais</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese (Simplified)</option>
                  </select>
                </div>

                {/* Timezone Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl neu-inset bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date Format</label>
                  <div className="flex flex-wrap gap-3">
                    {["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((format) => (
                      <button
                        key={format}
                        className="px-4 py-2 rounded-xl neu-button hover:scale-105 transition-all text-sm"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <NeuButton onClick={handleSave}>
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Saved
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
