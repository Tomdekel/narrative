import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Route redirects for UX redesign
const redirects: Record<string, string> = {
  '/dashboard/artifacts': '/dashboard/story',
  '/dashboard/artifacts/upload': '/dashboard/story',
  '/dashboard/claims': '/dashboard/insights',
  '/dashboard/resumes': '/dashboard/roles',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for redirects
  if (redirects[pathname]) {
    const url = request.nextUrl.clone()
    url.pathname = redirects[pathname]
    return NextResponse.redirect(url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
