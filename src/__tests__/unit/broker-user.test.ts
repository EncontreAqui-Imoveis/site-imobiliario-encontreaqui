const mockFetch = jest.fn()
beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
})

function okResponse(data: unknown) {
    return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(data),
    }
}

describe('broker API', () => {
    let broker: typeof import('@/lib/api/broker')

    beforeEach(async () => {
        jest.resetModules()
        broker = await import('@/lib/api/broker')
    })

    it('uploadBrokerDocuments() sends 3 files via FormData', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        const creciFront = new File(['front'], 'creci_front.jpg', { type: 'image/jpeg' })
        const creciBack = new File(['back'], 'creci_back.jpg', { type: 'image/jpeg' })
        const selfie = new File(['selfie'], 'selfie.jpg', { type: 'image/jpeg' })

        await broker.uploadBrokerDocuments({ creciFront, creciBack, selfie })

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/brokers/me/verify-documents')
        const formData = init.body as FormData
        expect(formData.get('creciFront')).toBeTruthy()
        expect(formData.get('creciBack')).toBeTruthy()
        expect(formData.get('selfie')).toBeTruthy()
    })

    it('getMyCommissions() calls correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce(okResponse([]))

        await broker.getMyCommissions()

        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain('/brokers/me/commissions')
    })
})

describe('user API', () => {
    let userApi: typeof import('@/lib/api/user')

    beforeEach(async () => {
        jest.resetModules()
        userApi = await import('@/lib/api/user')
    })

    it('createProperty() sends FormData via POST for broker flow', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ propertyId: 42 }))

        const formData = new FormData()
        formData.append('title', 'Test Property')
        const result = await userApi.createProperty(formData)

        expect(result.id).toBe(42)
        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/properties')
        expect(init.method).toBe('POST')
    })

    it('createProperty() sends client-owner flow to /properties/client', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({ propertyId: 77 }))

        const formData = new FormData()
        formData.append('title', 'Client Property')
        const result = await userApi.createProperty(formData, 'client-owner')

        expect(result.id).toBe(77)
        const [url] = mockFetch.mock.calls[0]
        expect(url).toContain('/properties/client')
    })

    it('deleteProperty() sends DELETE request', async () => {
        mockFetch.mockResolvedValueOnce(okResponse(undefined))

        await userApi.deleteProperty(99)

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/properties/99')
        expect(init.method).toBe('DELETE')
    })
})

describe('favorites API', () => {
    let favorites: typeof import('@/lib/api/favorites')

    beforeEach(async () => {
        jest.resetModules()
        favorites = await import('@/lib/api/favorites')
    })

    it('addFavorite() sends POST with propertyId in URL', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        await favorites.addFavorite(123)

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/users/favorites/123')
        expect(init.method).toBe('POST')
    })
})

describe('notifications API', () => {
    let notifications: typeof import('@/lib/api/notifications')

    beforeEach(async () => {
        jest.resetModules()
        notifications = await import('@/lib/api/notifications')
    })

    it('markAllAsRead() sends correct request', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        await notifications.markAllAsRead()

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/notifications')
        expect(init.method).toBe('POST')
    })
})
