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
        window.localStorage.clear()
        document.cookie = 'ea_auth_token=; Path=/; Max-Age=0'
        auth = await import('@/lib/api/auth')
    })

    it('login() sends POST to /auth/login', async () => {
        mockFetch.mockResolvedValueOnce(
            okResponse({
                user: { id: 1, role: 'client' },
                token: 'token-123',
                needsCompletion: false,
            }),
        )

        const result = await auth.login({ email: 'test@test.com', password: '123456' })

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/auth/login')
        expect(init.method).toBe('POST')
        expect(result).toEqual({
            user: { id: 1, role: 'client' },
            isBroker: false,
            broker: undefined,
            profileStatus: 'incomplete',
            requiresBrokerDocuments: false,
        })
        expect(window.localStorage.getItem('ea_auth_token')).toBeNull()
        expect(document.cookie).toContain('ea_auth_token=token-123')
    })

    it('register() sends POST with full payload', async () => {
        mockFetch.mockResolvedValueOnce(
            okResponse({
                user: {
                    id: 1,
                    role: 'client',
                    phone: null,
                    street: null,
                    number: null,
                    bairro: null,
                    city: null,
                    state: null,
                    cep: null,
                },
                token: 'token-xyz',
                needsCompletion: true,
            }),
        )

        const result = await auth.register({ name: 'João', email: 'j@test.com', password: '123', city: 'SP', state: 'SP' })

        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(body.name).toBe('João')
        expect(body.email).toBe('j@test.com')
        expect(body.city).toBe('SP')
        expect(result.profileStatus).toBe('incomplete')
        expect(window.localStorage.getItem('ea_auth_token')).toBeNull()
        expect(document.cookie).toContain('ea_auth_token=token-xyz')
    })

    it('register() on 409 retries via login híbrido (POST /auth/login)', async () => {
        mockFetch
            .mockResolvedValueOnce(errorResponse(409, 'Este email ja esta em uso.'))
            .mockResolvedValueOnce(
                okResponse({
                    user: { id: 2, role: 'client' },
                    token: 'token-after-409',
                    needsCompletion: false,
                }),
            )

        const result = await auth.register({
            name: 'Maria',
            email: 'maria@test.com',
            password: 'secret12',
        })

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(String(mockFetch.mock.calls[0][0])).toContain('/auth/register')
        expect(String(mockFetch.mock.calls[1][0])).toContain('/auth/login')
        expect(result.user.id).toBe(2)
        expect(document.cookie).toContain('ea_auth_token=token-after-409')
    })

    it('loginWithGoogle() sends idToken in body', async () => {
        mockFetch.mockResolvedValueOnce(
            okResponse({
                user: { id: 1, role: 'client' },
                token: 'google-token-session',
                needsCompletion: false,
            }),
        )

        const result = await auth.loginWithGoogle('google-token-123')

        const body = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(body.idToken).toBe('google-token-123')
        expect(result.isBroker).toBe(false)
        expect(window.localStorage.getItem('ea_auth_token')).toBeNull()
        expect(document.cookie).toContain('ea_auth_token=google-token-session')
    })

    it('loginWithGoogle() returns a pending payload when Google still needs profile choice', async () => {
        mockFetch.mockResolvedValueOnce(
            okResponse({
                isNewUser: true,
                requiresProfileChoice: true,
                pending: {
                    email: 'novo@teste.com',
                    name: 'Novo Usuário',
                    googleUid: 'google-uid-1',
                },
                requestedProfile: 'auto',
            }),
        )

        const result = await auth.loginWithGoogle('google-token-456')

        expect(result).toEqual({
            kind: 'google_pending',
            isNewUser: true,
            requiresProfileChoice: true,
            roleLocked: false,
            needsCompletion: true,
            requiresDocuments: false,
            requestedProfile: 'auto',
            pending: {
                email: 'novo@teste.com',
                name: 'Novo Usuário',
                googleUid: 'google-uid-1',
                googleIdToken: 'google-token-456',
            },
        })
        expect(document.cookie).not.toContain('ea_auth_token=')
    })

    it('fetchCurrentSession() returns null on 401', async () => {
        document.cookie = 'ea_auth_token=token-401; Path=/'
        mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'))

        const session = await auth.fetchCurrentSession()
        expect(session).toBeNull()
        expect(mockFetch.mock.calls[0][0]).toContain('/users/me')
    })

    it('fetchCurrentSession() propagates non-401/403 errors', async () => {
        document.cookie = 'ea_auth_token=token-500; Path=/'
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server error'))

        await expect(auth.fetchCurrentSession()).rejects.toThrow()
    })

    it('fetchCurrentSession() skips the request when there is no auth token', async () => {
        const session = await auth.fetchCurrentSession()
        expect(session).toBeNull()
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('migrates legacy localStorage token to cookie on browser read', async () => {
        window.localStorage.setItem('ea_auth_token', 'legacy-token')
        mockFetch.mockResolvedValueOnce(
            okResponse({
                role: 'client',
                user: { id: 1, name: 'Teste', email: 'teste@teste.com' },
            }),
        )

        await auth.fetchCurrentSession()

        expect(window.localStorage.getItem('ea_auth_token')).toBeNull()
        expect(document.cookie).toContain('ea_auth_token=legacy-token')
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

    it('sendEmailVerificationCode() posts to the new verification send endpoint', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ status: 'ok', delivery: 'sent' }))

        await auth.sendEmailVerificationCode('user@test.com')

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/auth/email-verification/send')
        expect(init.method).toBe('POST')
    })

    it('verifyPasswordResetCode() posts to the new password reset verify endpoint', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ reset_session_token: 'token', expires_at: '2026-03-06T10:00:00Z' }))

        await auth.verifyPasswordResetCode('user@test.com', '123456')

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/auth/password-reset/verify-code')
        expect(JSON.parse(init.body).code).toBe('123456')
    })
})
