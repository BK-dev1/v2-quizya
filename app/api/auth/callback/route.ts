import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=No code provided', origin))
  }

  // 1. We create the redirect response object first
  const response = NextResponse.redirect(new URL(next, origin))

  // 2. We initialize the Supabase client but tie its cookie operations to the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error.message}`, origin))
  }

  // Ensure profile exists for OAuth users
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // Create profile if it doesn't exist (for OAuth users)
    if (!existingProfile) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      const role = user.user_metadata?.role || 'student'
      
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          role: role
        })
    }
  }

  // 3. Logic for role-based redirect
  let redirectPath = next

  // If next is home, we check role to ensure teachers land on dashboard
  // Students also now land on dashboard instead of root if no specific path was requested
  if (next === '/' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'teacher' || profile?.role === 'student') {
      redirectPath = '/dashboard'
    } else {
      redirectPath = '/'
    }
  }

  // 4. If the final destination changed, update the response but KEEP the same cookies
  if (redirectPath !== next) {
    const finalResponse = NextResponse.redirect(new URL(redirectPath, origin))
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie as any)
    })
    return finalResponse
  }

  return response
}