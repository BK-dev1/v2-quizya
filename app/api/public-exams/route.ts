import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch public exams
    // We also want to know the number of attempts (sessions)
    // This is a bit complex with standard Supabase client without raw SQL or joining manually
    // For simplicity/performance MVP, we will fetch exams and then maybe count sessions or just return exams first.

    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        total_questions,
        room_code,
        created_at,
        created_by
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Error fetching public exams:', error)
    return NextResponse.json({ error: 'Failed to fetch public exams' }, { status: 500 })
  }
}
