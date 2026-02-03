import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=No code provided', request.url))
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error.message}`, request.url))
  }

  // Verify domain restriction for Google OAuth
  if (data.user.app_metadata.provider === 'google') {
    const email = data.user.email
    const emailDomain = email?.split('@')[1]

    // Enforce @ensia.edu.dz domain restriction
    if (emailDomain !== 'ensia.edu.dz') {
      // Sign out the user
      await supabase.auth.signOut()
      
      return NextResponse.redirect(
        new URL('/auth/login?error=Only @ensia.edu.dz email addresses are allowed', request.url)
      )
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
