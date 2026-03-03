jest.mock('@/lib/api/client', () => ({
    apiClient: {
        post: jest.fn(),
    },
}))

describe('propertyDeals service', () => {
    it('closePropertyDeal() posts to the close endpoint', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { closePropertyDeal } = await import('@/lib/propertyDeals')
        ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ status: 'sold' })

        const payload = {
            type: 'sale' as const,
            amount: 120000,
            commission_rate: 5,
            commission_cycles: 0,
            recurrence_interval: 'none',
        }

        await closePropertyDeal(42, payload)

        expect(apiClient.post).toHaveBeenCalledWith('/properties/42/close', payload)
    })

    it('cancelPropertyDeal() posts to the cancel endpoint', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { cancelPropertyDeal } = await import('@/lib/propertyDeals')
        ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ status: 'approved' })

        await cancelPropertyDeal(42)

        expect(apiClient.post).toHaveBeenCalledWith('/properties/42/cancel-deal')
    })
})
