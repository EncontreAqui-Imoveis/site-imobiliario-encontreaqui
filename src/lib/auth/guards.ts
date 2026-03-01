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
 * Guard de papel corretor server-side.
 * Redireciona para onboarding se não for broker aprovado.
 */
export async function requireBroker() {
    const session = await requireAuth()
    if (!session.isBroker || session.broker?.status !== 'approved') {
        redirect('/onboarding/broker')
    }
    return session
}

/**
 * Guard que exige perfil completo.
 * Redireciona para onboarding se dados essenciais estiverem faltando.
 */
export async function requireProfileComplete() {
    const session = await requireAuth()
    if (session.profileStatus === 'incomplete') {
        redirect('/onboarding')
    }
    return session
}

/**
 * Guard de papel cliente (qualquer autenticado que não precisa ser broker).
 */
export async function requireClient() {
    const session = await requireAuth()
    return session
}

