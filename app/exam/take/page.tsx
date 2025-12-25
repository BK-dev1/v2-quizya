'use client'

import { Suspense } from 'react'
import ExamTaking from '@/components/dashboard/exam-taking'

function TakeExamContent() {
  return <ExamTaking />
}

export default function TakeExamPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading exam...</p></div>}>
      <TakeExamContent />
    </Suspense>
  )
}