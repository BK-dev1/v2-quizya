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

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1. Define Route Groups
  const isAuthRoute = path.startsWith('/auth')
  const isPublicRoute = [
    '/', '/api', '/public-exams', '/join', '/about',
    '/pricing', '/privacy', '/terms', '/blog'
  ].some(route => path === route || path.startsWith(`${route}/`))

  // 2. LOGIC: If logged in, don't allow access to Login/Register
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. LOGIC: If teacher is on home page, redirect to dashboard
  if (user && path === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'teacher') {
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