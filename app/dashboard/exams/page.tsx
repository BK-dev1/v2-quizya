'use client'

import dynamic from 'next/dynamic'

const ExamsList = dynamic(() => import('@/components/dashboard/exams-list'), {
  ssr: false
})

export default function ExamsPage() {
  return <ExamsList />
}
