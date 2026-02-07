import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // 1. Define Route Groups
  const isAuthRoute = path.startsWith('/auth')
  const isPublicRoute = [
    '/', '/api', '/public-exams', '/join', '/about',
    '/pricing', '/privacy', '/terms', '/blog', '/attendance'
  ].some(route => path === route || path.startsWith(`${route}/`))

  const nextUrl = request.nextUrl
  const code = nextUrl.searchParams.get('code')

  // FAIL-SAFE: If a code is present on any route (except the callback itself), it should be processed by the callback
  // This handles cases where Supabase redirects back to the root instead of the callback
  if (code && path !== '/api/auth/callback' && (isPublicRoute || path === '/')) {
    const callbackUrl = new URL('/api/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    const next = nextUrl.searchParams.get('next')
    if (next) callbackUrl.searchParams.set('next', next)
    return NextResponse.redirect(callbackUrl)
  }

  // OPTIMIZATION: Skip getUser() for most public routes to reduce latency.
  if (isPublicRoute && path !== '/' && !isAuthRoute) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  // 2. LOGIC: If logged in, don't allow access to Login/Register
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. LOGIC: If teacher is on home page, redirect to dashboard
  if (user && path === '/') {
    let role = user.app_metadata?.role || user.user_metadata?.role

    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = profile?.role
    }

    if (role === 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 4. LOGIC: If logged out, don't allow access to Protected Routes
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}