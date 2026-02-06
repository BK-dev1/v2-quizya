'use client'

import dynamic from 'next/dynamic'

const AttendanceSession = dynamic(() => import('@/components/dashboard/attendance-session'), {
  ssr: false
})

export default function AttendanceSessionPage() {
  return <AttendanceSession />
}
