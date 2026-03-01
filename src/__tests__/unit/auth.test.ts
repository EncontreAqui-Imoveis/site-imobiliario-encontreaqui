// Mock fetch globally
const mockFetch = jest.fn()
beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
})

// Helper to create successful response
function okResponse(data: unknown) {
    return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(data),
    }
}

function errorResponse(status: number, message: string) {
    return {
        ok: false,
        status,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve({ message }),
    }
}

describe('auth API', () => {
    let auth: typeof import('@/lib/api/auth')

    beforeEach(async () => {
        jest.resetModules()
        auth = await import('@/lib/api/auth')
    })

    it('login() sends POST to /auth/login', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'complete' }
        mockFetch.mockResolvedValueOnce(okResponse(session))

        const result = await auth.login({ email: 'test@test.com', password: '123456' })

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/auth/login')
        expect(init.method).toBe('POST')
        expect(result).toEqual(session)
    })

    it('register() sends POST with full payload', async () => {
        const session = { user: { id: 1 }, isBroker: false, profileStatus: 'incomplete' }
        mockFetch.mockResolvedValueOnce(okResponse(session))

        await auth.register({ name: 'João', email: 'j@test.com', password: '123', city: 'SP', state: 'SP' })

        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(body.name).toBe('João')
        expect(body.email).toBe('j@test.com')
        expect(body.city).toBe('SP')
    })

    it('loginWithGoogle() sends idToken in body', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ user: { id: 1 } }))

        await auth.loginWithGoogle('google-token-123')

        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(body.idToken).toBe('google-token-123')
    })

    it('fetchCurrentSession() returns null on 401', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'))

        const session = await auth.fetchCurrentSession()
        expect(session).toBeNull()
    })

    it('fetchCurrentSession() propagates non-401/403 errors', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server error'))

        await expect(auth.fetchCurrentSession()).rejects.toThrow()
    })

    it('logout() does not throw even on failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        // Should not throw
        await expect(auth.logout()).resolves.toBeUndefined()
    })

    it('checkEmail() URL-encodes the email in query string', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ exists: true }))

        await auth.checkEmail('user+test@example.com')

        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain(encodeURIComponent('user+test@example.com'))
    })
})
