import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password, full_name, role } = await request.json()

  // Validate input
  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'Email, password, and full name are required' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()

  // Use standard client for auth operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )

  // Sanitize role - allow 'teacher' or 'student', default to 'student'
  const safeRole = role === 'teacher' ? 'teacher' : 'student'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role: safeRole
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://quizya.vercel.app'}/api/auth/callback`
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Profile record is created automatically via database trigger (handle_new_user)
  // which extracts full_name and role from raw_user_meta_data

  return NextResponse.json({ user: data.user })
}