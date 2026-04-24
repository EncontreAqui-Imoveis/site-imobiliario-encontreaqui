import type { UserSession } from '@/lib/api/auth'

export interface PendingAction {
    href: string
    title: string
    description: string
}

function hasVerifiedContact(session: UserSession): boolean {
    const emailVerified = session.user.email_verified === true
    const hasPhone = String(session.user.phone ?? '').trim().length > 0
    return emailVerified || hasPhone
}

function normalizeNextPath(next: string | null | undefined): string | null {
    const value = String(next ?? '').trim()
    if (!value.startsWith('/')) return null
    if (value.startsWith('//')) return null
    return value
}

export function resolvePostAuthRoute(
    session: UserSession,
    next?: string | null,
): string {
    const safeNext = normalizeNextPath(next)

    if (!hasVerifiedContact(session)) {
        return '/verificacao'
    }

    if (session.profileStatus === 'incomplete') {
        return '/onboarding'
    }

    if (session.isBroker && session.broker?.status !== 'approved') {
        return '/onboarding/broker'
    }

    return safeNext ?? '/meus-imoveis'
}

export function resolveOperationalGateRoute(
    session: UserSession | null | undefined,
): string | null {
    return resolvePendingAction(session)?.href ?? null
}

export function resolvePendingAction(
    session: UserSession | null | undefined,
): PendingAction | null {
    if (!session) return null

    if (!hasVerifiedContact(session)) {
        return {
            href: '/verificacao',
            title: 'Verificar contato',
            description: 'Confirme e-mail ou telefone para liberar os próximos fluxos.',
        }
    }

    if (session.profileStatus === 'incomplete') {
        return {
            href: '/onboarding',
            title: 'Completar perfil',
            description: 'Finalize telefone e endereço antes de operar normalmente.',
        }
    }

    if (session.isBroker && session.broker?.status !== 'approved') {
        return {
            href: '/onboarding/broker',
            title: session.requiresBrokerDocuments ? 'Enviar documentos' : 'Finalizar corretor',
            description: session.requiresBrokerDocuments
                ? 'Envie os documentos do seu CRECI para concluir a validação de corretor.'
                : 'Seu cadastro de corretor ainda precisa ser concluído.',
        }
    }

    return null
}
