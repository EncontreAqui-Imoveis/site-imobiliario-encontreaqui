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
  '/meus-processos',
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

/**
 * The process hub is now the only client-facing entrance for proposal and
 * contract follow-up. Creation stays under /propostas/nova because it is an
 * action, not a process listing.
 */
function resolveLegacyProcessDestination(request: NextRequest): URL | null {
  const { pathname } = request.nextUrl
  let destinationPath: string | null = null

  if (pathname === '/documentos') {
    const tab = request.nextUrl.searchParams.get('tab')
    destinationPath = tab === 'contratos'
      ? '/meus-processos/contratos'
      : tab === 'propostas'
        ? '/meus-processos/propostas'
        : '/meus-processos'
  } else if (pathname === '/propostas') {
    destinationPath = '/meus-processos/propostas'
  } else if (
    pathname.startsWith('/propostas/') &&
    !pathname.startsWith('/propostas/nova')
  ) {
    destinationPath = `/meus-processos${pathname}`
  } else if (pathname === '/contratos' || pathname.startsWith('/contratos/')) {
    destinationPath = `/meus-processos${pathname}`
  }

  if (!destinationPath) return null
  const url = request.nextUrl.clone()
  url.pathname = destinationPath
  return url
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(authTokenCookieName)?.value?.trim()
  const hasToken = Boolean(token)
  const isSignupBrokerOnboarding =
    pathname === '/onboarding/broker' && request.nextUrl.searchParams.get('mode') === 'signup'

  const legacyProcessDestination = resolveLegacyProcessDestination(request)
  if (legacyProcessDestination) {
    // 302 avoids browsers permanently caching a migration while the new hub is
    // being rolled out. All internal links already use the canonical route.
    return NextResponse.redirect(legacyProcessDestination, 302)
  }

  if (isProtectedRoute(pathname) && !hasToken) {
    if (isSignupBrokerOnboarding) {
      return NextResponse.next()
    }
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
