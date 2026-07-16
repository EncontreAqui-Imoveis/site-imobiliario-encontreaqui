import type { UserSession } from '@/lib/api/auth'

export interface PendingAction {
    href: string
    title: string
    description: string
}

export function getBrokerStatus(session: UserSession | null | undefined): string | null {
    if (!session) return null
    const status = session.broker?.status ?? session.user?.broker_status
    if (typeof status !== 'string') return null
    return status
}

export function isBrokerUser(session: UserSession | null | undefined): boolean {
    if (!session) return false
    return Boolean(session.isBroker || session.user?.role === 'broker' || getBrokerStatus(session) != null)
}

export function isRestrictedBroker(session: UserSession | null | undefined): boolean {
    if (!isBrokerUser(session)) return false
    const status = getBrokerStatus(session)
    // pending_verification means documents were submitted and are under review;
    // the user has nothing left to do, so they are NOT restricted.
    return status !== 'approved' && status !== 'pending_verification'
}

export function isApprovedBroker(session: UserSession | null | undefined): boolean {
    return getBrokerStatus(session) === 'approved' && isBrokerUser(session)
}

function hasVerifiedContact(session: UserSession): boolean {
    if (session.user.role === 'auxiliary_administrative') {
        return true
    }
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
    if (session.user.role === 'auxiliary_administrative') {
        return safeNext ?? '/meus-processos/propostas'
    }

    if (!hasVerifiedContact(session)) {
        return '/verificacao'
    }

    if (session.profileStatus === 'incomplete') {
        return '/onboarding'
    }

    if (isRestrictedBroker(session)) {
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
    if (session.user.role === 'auxiliary_administrative') return null

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

    if (isRestrictedBroker(session)) {
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
