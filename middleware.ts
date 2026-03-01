import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCKED_PREFIXES = [
  '/auth',
  '/perfil',
  '/favoritos',
  '/propostas',
  '/contratos',
  '/notificacoes',
  '/meus-imoveis',
  '/relatorios',
  '/configuracoes',
  '/verificacao',
  '/onboarding',
  '/anuncie',
  '/recuperar-senha',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!LOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/'
  redirectUrl.searchParams.set('openApp', '1')
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/perfil/:path*',
    '/favoritos/:path*',
    '/propostas/:path*',
    '/contratos/:path*',
    '/notificacoes/:path*',
    '/meus-imoveis/:path*',
    '/relatorios/:path*',
    '/configuracoes/:path*',
    '/verificacao/:path*',
    '/onboarding/:path*',
    '/anuncie/:path*',
    '/recuperar-senha/:path*',
  ],
}
