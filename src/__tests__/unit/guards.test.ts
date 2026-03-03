// Guards use next/navigation's redirect which throws an error to interrupt flow
jest.mock('next/navigation', () => ({
    redirect: jest.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`)
    }),
}))

// Mock fetchCurrentSession
const mockFetchSession = jest.fn()
jest.mock('@/lib/api/auth', () => ({
    fetchCurrentSession: (...args: unknown[]) => mockFetchSession(...args),
}))

describe('auth guards', () => {
    let guards: typeof import('@/lib/auth/guards')

    beforeEach(async () => {
        jest.resetModules()
        mockFetchSession.mockReset()
        // Re-import to get fresh module
        jest.mock('next/navigation', () => ({
            redirect: jest.fn((url: string) => {
                throw new Error(`REDIRECT:${url}`)
            }),
        }))
        jest.mock('@/lib/api/auth', () => ({
            fetchCurrentSession: (...args: unknown[]) => mockFetchSession(...args),
        }))
        guards = await import('@/lib/auth/guards')
    })

    it('requireAuth() returns session when authenticated', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'complete' }
        mockFetchSession.mockResolvedValueOnce(session)

        const result = await guards.requireAuth()
        expect(result).toEqual(session)
    })

    it('requireAuth() redirects to /auth/login when not authenticated', async () => {
        mockFetchSession.mockResolvedValueOnce(null)

        await expect(guards.requireAuth()).rejects.toThrow('REDIRECT:/auth/login')
    })

    it('requireBroker() redirects to /onboarding/broker when not approved', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'complete', broker: null }
        mockFetchSession.mockResolvedValueOnce(session)

        await expect(guards.requireBroker()).rejects.toThrow('REDIRECT:/onboarding/broker')
    })

    it('requireProfileComplete() redirects to /onboarding when incomplete', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'incomplete' }
        mockFetchSession.mockResolvedValueOnce(session)

        await expect(guards.requireProfileComplete()).rejects.toThrow('REDIRECT:/onboarding')
    })

    it('requireClient() returns session (alias of requireAuth)', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'complete' }
        mockFetchSession.mockResolvedValueOnce(session)

        const result = await guards.requireClient()
        expect(result).toEqual(session)
    })
})
