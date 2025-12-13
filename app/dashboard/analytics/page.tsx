'use client'

import dynamic from 'next/dynamic'

const AnalyticsDashboard = dynamic(() => import('@/components/dashboard/analytics-dashboard'), {
  ssr: false
})

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}