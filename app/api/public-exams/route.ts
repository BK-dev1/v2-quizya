import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use cached service role client for public data (no auth needed)
    const supabase = createServiceRoleClient()

    // Fetch public exams with minimal fields for performance
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        total_questions,
        room_code,
        created_at
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching public exams:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(exams || [])
  } catch (error) {
    console.error('Error fetching public exams:', error)
    return NextResponse.json({ error: 'Failed to fetch public exams' }, { status: 500 })
  }
}
