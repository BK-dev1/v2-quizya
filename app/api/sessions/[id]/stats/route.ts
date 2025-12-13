import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get exam stats
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('score')
      .eq('exam_id', params.id)
      .eq('status', 'completed')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const sessionCount = sessions?.length || 0
    const avgScore = sessionCount > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessionCount)
      : 0

    return NextResponse.json({
      sessionCount,
      avgScore
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
