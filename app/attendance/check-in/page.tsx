'use client'

import dynamic from 'next/dynamic'

const CheckInForm = dynamic(() => import('@/components/attendance/check-in-form'), {
  ssr: false
})

export default function CheckInPage() {
  return <CheckInForm />
}
