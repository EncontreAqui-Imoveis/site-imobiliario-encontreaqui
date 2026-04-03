describe('observability redaction', () => {
    const captureException = jest.fn()

    beforeEach(() => {
        captureException.mockReset()
        ;(globalThis as typeof globalThis & { Sentry?: { captureException: typeof captureException } }).Sentry = {
            captureException,
        }
    })

    afterEach(() => {
        delete (globalThis as typeof globalThis & { Sentry?: unknown }).Sentry
    })

    it('redacts sensitive values before sending to Sentry', async () => {
        const { reportObservedError } = await import('@/lib/observability')

        reportObservedError(new Error('boom'), {
            module: 'test',
            status: 500,
            url: 'https://site.test/propostas?email=user@test.com&token=abc123',
            message: 'Falha para user@test.com com Bearer secret-token e telefone 62999998888',
        })

        expect(captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                extra: expect.objectContaining({
                    url: 'https://site.test/propostas',
                    message: expect.stringContaining('***@***'),
                }),
            }),
        )

        const payload = captureException.mock.calls[0][1]
        expect(payload.extra.message).not.toContain('user@test.com')
        expect(payload.extra.message).not.toContain('62999998888')
        expect(payload.extra.message).toContain('Bearer ***')
    })
})
