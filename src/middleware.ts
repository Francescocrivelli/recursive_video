import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  // Allow public paths without authentication
  const publicPaths = ['/', '/login', '/role-selection', '/register']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for all other routes
  if (!session) {
    // If not authenticated and trying to access protected route, redirect to landing page
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Route protection based on role
  if (pathname.startsWith('/patient')) {
    const isPatient = session.value.includes('patient')
    const isTherapist = session.value.includes('therapist')
    
    if (!isPatient && !isTherapist) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Therapist-only routes
  if (pathname.startsWith('/therapist')) {
    const isTherapist = session.value.includes('therapist')
    if (!isTherapist) {
      return NextResponse.redirect(new URL('/', request.url))
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