'use client'

import dynamic from 'next/dynamic'

const AttendanceList = dynamic(() => import('@/components/dashboard/attendance-list'), {
  ssr: false
})

export default function AttendancePage() {
  return <AttendanceList />
}
