import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/auth/me] Request received')
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[/api/auth/me] Supabase error:', error)
      return NextResponse.json({ user: null }, { status: 200 })
    }

    if (!user) {
      console.log('[/api/auth/me] No user found')
      return NextResponse.json({ user: null }, { status: 200 })
    }

    console.log('[/api/auth/me] User found:', user.id)
    return NextResponse.json({ user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    } }, { status: 200 })
  } catch (error) {
    console.error('[/api/auth/me] Unexpected error:', error)
    return NextResponse.json({ 
      user: null,
      error: error instanceof Error ? error.message : 'Failed to fetch user' 
    }, { status: 500 })
  }
}
