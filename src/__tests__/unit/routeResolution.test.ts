import {
    resolveOperationalGateRoute,
    resolvePostAuthRoute,
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

    it('ignores unsafe next values', () => {
        const session = buildSession()

        expect(resolvePostAuthRoute(session, 'https://evil.example')).toBe('/meus-imoveis')
        expect(resolvePostAuthRoute(session, '//evil.example')).toBe('/meus-imoveis')
    })
})
