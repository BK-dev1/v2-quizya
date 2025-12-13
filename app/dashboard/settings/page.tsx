'use client'

import dynamic from 'next/dynamic'

const SettingsDashboard = dynamic(() => import('@/components/dashboard/settings-dashboard'), {
  ssr: false
})

export default function SettingsPage() {
  return <SettingsDashboard />
}
