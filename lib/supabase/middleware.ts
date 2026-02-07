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

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Check if route requires authentication
  const isPublicRoute = [
    '/', '/auth', '/api', '/public-exams', '/join', '/join-quiz', '/live-quiz',
    '/about', '/pricing', '/privacy', '/terms', '/blog', '/accessibility', '/exam/take', '/attendance'
  ].some(route => path === route || path.startsWith(`${route}/`))

  if (!user && !isPublicRoute) {
    // no user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}