import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        total_questions,
        created_at,
        profiles!exams_created_by_fkey (
          username
        )
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(exams || [])
  } catch (error) {
    console.error('Error fetching public exams:', error)
    return NextResponse.json({ error: 'Failed to fetch public exams' }, { status: 500 })
  }
}
