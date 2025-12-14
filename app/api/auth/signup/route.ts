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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role: role || 'student'
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Create profile record using service role (bypasses RLS)
  if (data.user) {
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
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

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name,
        role: role || 'student'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError.message)
      // Don't fail the signup if profile creation fails - user can still sign in
      // The profile will be created via trigger or manually later
    }
  }

  return NextResponse.json({ user: data.user })
}