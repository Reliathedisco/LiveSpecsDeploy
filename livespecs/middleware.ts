import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/dashboard', '/docs']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  const publicAuthPaths = ['/sign-in', '/sign-up']
  const isPublicAuthPath = publicAuthPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !isPublicAuthPath) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/docs/:path*',
  ],
}
