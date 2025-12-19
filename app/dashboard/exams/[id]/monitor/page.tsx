'use client'

import ExamMonitor from '@/components/dashboard/exam-monitor'
import { useParams } from 'next/navigation'
import { Link } from 'lucide-react'
import { NeuButton } from '@/components/ui/neu-button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MonitorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <NeuButton variant="ghost" className="gap-2 pl-0 hover:bg-transparent" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </NeuButton>
      </div>
      <ExamMonitor examId={id} />
    </div>
  )
}
