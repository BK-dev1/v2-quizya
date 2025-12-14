'use client'

import { Suspense } from 'react'
import ExamResults from '@/components/exam-students/exam-results'

function ResultsContent() {
  return <ExamResults />
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading results...</p></div>}>
      <ResultsContent />
    </Suspense>
  )
}
