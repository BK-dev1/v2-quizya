import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token, email } = await request.json()

  if (!token || !email) {
    return NextResponse.json(
      { error: 'Token and email are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: data.user
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Invalid verification link', request.url)
    )
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/auth/login?verified=true&message=Email verified! You can now login.', request.url)
    )
  } catch (err) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Verification failed', request.url)
    )
  }
}
