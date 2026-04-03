import type { UserSession } from '@/lib/api/auth'

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

    if (!session.user.email_verified) {
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
    if (!session) return null

    if (!session.user.email_verified) {
        return '/verificacao'
    }

    if (session.profileStatus === 'incomplete') {
        return '/onboarding'
    }

    return null
}
