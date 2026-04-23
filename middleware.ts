import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Hardening de acesso:
 * - preserva a experiência web (sem redireciono para app nativo)
 * - adiciona proteção server-side mínima para áreas privadas
 * - evita depender somente de redirects client-side
 */
const protectedRoutePrefixes = [
  '/favoritos',
  '/anuncie',
  '/meus-imoveis',
  '/propostas',
  '/contratos',
  '/perfil',
  '/configuracoes',
  '/notificacoes',
  '/relatorios',
  '/onboarding',
]

const authRoutePrefixes = ['/auth/login', '/auth/cadastro']
const authTokenCookieName = 'ea_auth_token'

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) => matchesPrefix(pathname, prefix))
}

function isAuthRoute(pathname: string): boolean {
  return authRoutePrefixes.some((prefix) => matchesPrefix(pathname, prefix))
}

function buildSafeNext(pathname: string, search: string): string {
  const target = `${pathname}${search}`
  if (!target.startsWith('/') || target.startsWith('//')) return '/'
  return target
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(authTokenCookieName)?.value?.trim()
  const hasToken = Boolean(token)

  if (isProtectedRoute(pathname) && !hasToken) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', buildSafeNext(pathname, search))
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute(pathname) && hasToken) {
    const appUrl = request.nextUrl.clone()
    appUrl.pathname = '/meus-imoveis'
    appUrl.search = ''
    return NextResponse.redirect(appUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
