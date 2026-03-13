import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * As rotas protegidas do site são tratadas nos guards e nas páginas.
 * O middleware não deve mais redirecionar o usuário para abrir o app,
 * pois isso impede a navegação normal da experiência web.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}
