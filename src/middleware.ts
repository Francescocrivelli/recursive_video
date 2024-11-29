import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')

  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/role-selection']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check authentication
  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    return response
  }

  // Route protection based on path prefix
  if (pathname.startsWith('/therapist')) {
    // Verify therapist role - you might want to decode the session token and verify the role
    const isTherapist = session.value.includes('therapist') // This is a simplified check
    if (!isTherapist) {
      return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/patient')) {
    // Verify patient role
    const isPatient = session.value.includes('patient') // This is a simplified check
    if (!isPatient) {
      return NextResponse.redirect(new URL('/therapist/select-therapy', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}