import { ApiError } from '@/lib/api/client'

// We test the ApiError class directly and mock fetch for request behavior
describe('ApiError', () => {
    it('stores status, message, and payload', () => {
        const err = new ApiError(400, 'Bad Request', { code: 'INVALID' }, 'req-1')
        expect(err.status).toBe(400)
        expect(err.message).toBe('Bad Request')
        expect(err.payload?.code).toBe('INVALID')
        expect(err.requestId).toBe('req-1')
        expect(err.name).toBe('ApiError')
    })

    it('extends Error', () => {
        const err = new ApiError(500, 'Internal')
        expect(err).toBeInstanceOf(Error)
    })
})

// Mock fetch for apiClient tests
const mockFetch = jest.fn()
const sentryCaptureMock = jest.fn()
beforeEach(() => {
    global.fetch = mockFetch
    ; (globalThis as typeof globalThis & { Sentry?: { captureException: typeof sentryCaptureMock } }).Sentry = {
        captureException: sentryCaptureMock,
    }
    mockFetch.mockReset()
    sentryCaptureMock.mockReset()
})

afterEach(() => {
    delete (globalThis as typeof globalThis & { Sentry?: unknown }).Sentry
})

describe('apiClient request behavior', () => {
    // Import dynamically to use fresh fetch mock
    let apiClient: typeof import('@/lib/api/client').apiClient

    beforeEach(async () => {
        jest.resetModules()
        const mod = await import('@/lib/api/client')
        apiClient = mod.apiClient
    })

    it('GET sends Content-Type: application/json', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({ data: true }),
        })

        await apiClient.get('/test')

        const calledInit = mockFetch.mock.calls[0][1]
        const headers = calledInit.headers as Headers
        expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('POST with FormData does NOT send Content-Type header', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({}),
        })

        const formData = new FormData()
        formData.append('file', 'test')
        await apiClient.post('/upload', formData)

        const calledInit = mockFetch.mock.calls[0][1]
        const headers = calledInit.headers as Headers
        expect(headers.has('Content-Type')).toBe(false)
    })

    it('includes credentials by default', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({}),
        })

        await apiClient.get('/test')

        const calledInit = mockFetch.mock.calls[0][1]
        expect(calledInit.credentials).toBe('include')
    })

    it('throws ApiError on 400 response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            headers: new Headers({ 'Content-Type': 'application/json', 'x-request-id': 'req-header-400' }),
            json: () => Promise.resolve({ message: 'Bad input' }),
        })

        await expect(apiClient.post('/test', {})).rejects.toMatchObject({
            message: 'Bad input',
            requestId: 'req-header-400',
        })
        expect(sentryCaptureMock).toHaveBeenCalledTimes(1)
        expect(sentryCaptureMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Bad input',
                requestId: 'req-header-400',
            }),
            expect.objectContaining({
                tags: expect.objectContaining({
                    module: 'api-client',
                    requestId: 'req-header-400',
                }),
            })
        )
    })

    it('falls back to requestId from payload when header is absent', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 422,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({ message: 'Payload inválido', requestId: 'req-body-422' }),
        })

        await expect(apiClient.post('/test', {})).rejects.toMatchObject({
            message: 'Payload inválido',
            requestId: 'req-body-422',
        })
    })

    it('does not throw when skipThrowOnError is true', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({ message: 'Server error' }),
        })

        const result = await apiClient.get('/test', { skipThrowOnError: true })
        expect(result).toBeDefined()
    })

    it('401 on non-auth path triggers redirect (never resolves)', async () => {
        // In jsdom, window.location.href assignment triggers 'Not implemented' error
        // but the interceptor still returns a never-resolving promise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({ message: 'Unauthorized' }),
        })

        // The request should never resolve (interceptor returns pending promise)
        const result = await Promise.race([
            apiClient.get('/propostas/list').catch(() => 'error'),
            new Promise(resolve => setTimeout(() => resolve('timeout'), 200)),
        ])

        // The interceptor tried to navigate (jsdom logs 'Not implemented')
        expect(result).toBe('timeout')
        consoleSpy.mockRestore()
    })

    it('401 on auth path does NOT redirect, throws ApiError', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve({ message: 'Wrong password' }),
        })

        await expect(apiClient.post('/auth/login', {})).rejects.toThrow('Wrong password')
    })
})
