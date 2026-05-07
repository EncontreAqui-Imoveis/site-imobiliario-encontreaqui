jest.mock('@/lib/api/client', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
    },
}))

describe('negotiations service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('fetchMyNegotiations() tenta endpoint primário e faz fallback em 404', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { fetchMyNegotiations } = await import('@/lib/negotiationsService')
        ;(apiClient.get as jest.Mock)
            .mockRejectedValueOnce({ status: 404 })
            .mockResolvedValueOnce([])

        await fetchMyNegotiations()

        expect(apiClient.get).toHaveBeenCalledWith('/negotiations/me')
        expect(apiClient.get).toHaveBeenCalledWith('/me/negotiations')
    })

    it('createProposal() delegates to apiClient.post', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { createProposal } = await import('@/lib/negotiationsService')
        ;(apiClient.post as jest.Mock).mockResolvedValueOnce(undefined)

        const payload = {
            propertyId: 10,
            clientName: 'Cliente',
            clientCpf: '12345678900',
            validadeDias: 10,
            payment: {
                dinheiro: 10,
                permuta: 0,
                financiamento: 0,
                outros: 0,
            },
        }

        await createProposal(payload)

        expect(apiClient.post).toHaveBeenCalledWith(
            '/negotiations/proposal',
            expect.objectContaining({
                ...payload,
                idempotency_key: expect.any(String),
            }),
        )
        expect((apiClient.post as jest.Mock).mock.calls[0][1]).not.toHaveProperty('idempotencyKey')
    })

    it('searchApprovedBrokers() normalizes the payload and filters invalid brokers', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { searchApprovedBrokers } = await import('@/lib/negotiationsService')
        ;(apiClient.get as jest.Mock).mockResolvedValueOnce({
            data: [
                { id: 1, name: 'Corretor Válido' },
                { id: 0, name: 'Inválido' },
                { id: 2, name: '' },
            ],
        })

        const result = await searchApprovedBrokers('corretor')

        expect(apiClient.get).toHaveBeenCalledWith('/brokers/approved?search=corretor&limit=5')
        expect(result).toEqual([{ id: 1, name: 'Corretor Válido' }])
    })
})
