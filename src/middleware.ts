import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  console.log('Session Cookie:', session); // Log the session cookie

  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/role-selection']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check authentication
  if (!session) {
    console.log('No session found, redirecting to /login'); // Log redirection
    const response = NextResponse.redirect(new URL('/login', request.url))
    return response
  }

  // Route protection based on path prefix
  if (pathname.startsWith('/patient')) {
    const isPatient = session.value.includes('patient');
    const isTherapist = session.value.includes('therapist');
    
    // Allow both patients and therapists to access patient routes
    if (!isPatient && !isTherapist) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Therapist-only routes
  if (pathname.startsWith('/therapist')) {
    const isTherapist = session.value.includes('therapist');
    if (!isTherapist) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}