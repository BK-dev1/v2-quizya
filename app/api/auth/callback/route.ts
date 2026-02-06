import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=No code provided', origin))
  }

  // 1. We create a response object first so we can attach cookies to it
  const response = NextResponse.redirect(new URL(next, origin))

  // 2. Pass this response to your server client helper
  // NOTE: Ensure your createClient helper is set up to modify this response's cookies!
  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error.message}`, origin))
  }

  // Logic for role-based redirect
  let redirectPath = next
  if (next === '/dashboard') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      redirectPath = profile?.role === 'teacher' ? '/dashboard' : '/'
    }
  }

  // 3. IMPORTANT: Create the final redirect but MANUALLY copy the cookies 
  // from the supabase exchange over to the final response.
  const finalResponse = NextResponse.redirect(new URL(redirectPath, origin))

  // This is the "magic" line that prevents the double-login bug:
  request.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value)
  })

  return finalResponse
}