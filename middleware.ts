import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_APP_PATHS = new Set([
  '/app/login',
  '/app/signup',
  '/app/forgot-password',
  '/app/pricing',
  '/app/waitlist',
])

function isPublicAppPath(pathname: string) {
  return PUBLIC_APP_PATHS.has(pathname)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/app')) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })

  if (pathname === '/app') {
    const url = req.nextUrl.clone()
    url.pathname = token ? '/app/home' : '/app/login'
    return NextResponse.redirect(url)
  }

  if (isPublicAppPath(pathname)) {
    return NextResponse.next()
  }

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/app/login'
    url.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*'],
}
