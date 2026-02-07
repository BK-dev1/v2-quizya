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

<<<<<<< HEAD
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

  // OPTIMIZATION: Skip getUser() for most public routes and API routes to reduce latency.
  // We handle teacher redirection (from /) on the client side now to improve TTFB
  if (isPublicRoute && !isAuthRoute) {
    return supabaseResponse
  }

  // OPTIMIZATION: Skip expensive auth check for dashboard routes - they're protected client-side
  // This reduces middleware latency from 17s to <1s
  if (path.startsWith('/dashboard')) {
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
=======
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/public-exams') &&
    !request.nextUrl.pathname.startsWith('/join') &&
    !request.nextUrl.pathname.startsWith('/join-quiz') &&
    !request.nextUrl.pathname.startsWith('/live-quiz') &&
    !request.nextUrl.pathname.startsWith('/about') &&
    !request.nextUrl.pathname.startsWith('/pricing') &&
    !request.nextUrl.pathname.startsWith('/privacy') &&
    !request.nextUrl.pathname.startsWith('/terms') &&
    !request.nextUrl.pathname.startsWith('/accessibility') &&
    !request.nextUrl.pathname.startsWith('/blog') &&
    !request.nextUrl.pathname.startsWith('/exam/take') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
>>>>>>> 572bd56 (fix styling issue)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}