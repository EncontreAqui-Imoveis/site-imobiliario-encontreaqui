import { redirect } from 'next/navigation'
import { fetchCurrentSession } from '@/lib/api/auth'

/**
 * Guard server-side simples para rotas que exigem usuário autenticado.
 * Pode ser usado em server components ou loaders de página.
 */
export async function requireAuth() {
    const session = await fetchCurrentSession()
    if (!session) {
        redirect('/auth/login')
    }
    return session
}

/**
 * Guard de papel (cliente/corretor) server-side.
 */
export async function requireBroker() {
    const session = await requireAuth()
    if (!session.isBroker || session.broker?.status !== 'approved') {
        redirect('/onboarding/broker')
    }
    return session
}

