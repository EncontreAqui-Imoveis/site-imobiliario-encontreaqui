import {
    isApprovedBroker,
    isRestrictedBroker,
    resolveOperationalGateRoute,
    resolvePostAuthRoute,
    getBrokerStatus,
} from '@/lib/auth/routeResolution'
import type { UserSession } from '@/lib/api/auth'

function buildSession(overrides: Partial<UserSession> = {}): UserSession {
    return {
        user: {
            id: 1,
            name: 'Teste',
            email: 'teste@exemplo.com',
            createdAt: new Date().toISOString(),
            email_verified: true,
        },
        isBroker: false,
        profileStatus: 'complete',
        ...overrides,
    }
}

describe('routeResolution', () => {
    it('prioritizes email verification after auth', () => {
        const session = buildSession({
            user: {
                ...buildSession().user,
                email_verified: false,
            },
        })

        expect(resolvePostAuthRoute(session, '/meus-imoveis')).toBe('/verificacao')
        expect(resolveOperationalGateRoute(session)).toBe('/verificacao')
    })

    it('prioritizes onboarding for incomplete profile', () => {
        const session = buildSession({
            profileStatus: 'incomplete',
        })

        expect(resolvePostAuthRoute(session, '/meus-imoveis')).toBe('/onboarding')
        expect(resolveOperationalGateRoute(session)).toBe('/onboarding')
    })

    it('keeps safe next route for complete session', () => {
        const session = buildSession()

        expect(resolvePostAuthRoute(session, '/contratos')).toBe('/contratos')
        expect(resolveOperationalGateRoute(session)).toBeNull()
    })

    it('determina broker pendente por broker_status mesmo sem role', () => {
        const session = buildSession({
            user: {
                ...buildSession().user,
                role: undefined,
                broker_status: 'pending_documents' as unknown as 'pending_verification',
            },
            isBroker: true,
            broker: undefined,
        })

        expect(getBrokerStatus(session)).toBe('pending_documents')
        expect(isRestrictedBroker(session)).toBe(true)
        expect(resolveOperationalGateRoute(session)).toBe('/onboarding/broker')
    })

    it('mantém fluxo de corretor aprovado por broker_status sem role', () => {
        const session = buildSession({
            user: {
                ...buildSession().user,
                role: undefined,
                broker_status: 'approved',
            },
            isBroker: true,
            broker: undefined,
            profileStatus: 'complete',
        })

        expect(getBrokerStatus(session)).toBe('approved')
        expect(isRestrictedBroker(session)).toBe(false)
        expect(isApprovedBroker(session)).toBe(true)
        expect(resolveOperationalGateRoute(session)).toBeNull()
    })

    it('ignores unsafe next values', () => {
        const session = buildSession()

        expect(resolvePostAuthRoute(session, 'https://evil.example')).toBe('/meus-imoveis')
        expect(resolvePostAuthRoute(session, '//evil.example')).toBe('/meus-imoveis')
    })
})
