import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`
      }
    })

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
    }

    if (!data?.url) {
      console.error('No OAuth URL returned')
      return NextResponse.redirect(new URL('/auth/login?error=no_url', request.url))
    }

    // Redirect to the OAuth URL
    return NextResponse.redirect(data.url)
  } catch (error) {
    console.error('Google sign-in error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=server_error', request.url))
  }
}
