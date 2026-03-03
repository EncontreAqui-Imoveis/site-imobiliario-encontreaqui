/**
 * Unit tests for the notifications API functions
 */
const mockFetch = jest.fn()
beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
})

function okResponse(data: unknown = {}) {
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

describe('Notifications API', () => {
    let api: typeof import('@/lib/api/notifications')

    beforeEach(async () => {
        jest.resetModules()
        api = await import('@/lib/api/notifications')
    })

    describe('getNotifications', () => {
        it('fetches GET /users/notifications', async () => {
            const notifications = [
                { id: 1, title: 'New proposal', message: 'You got a proposal', isRead: false },
                { id: 2, title: null, message: 'Property approved', isRead: true },
            ]
            mockFetch.mockResolvedValueOnce(okResponse(notifications))

            const result = await api.getNotifications()

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const url = mockFetch.mock.calls[0][0]
            expect(url).toContain('/users/notifications')
            expect(result).toEqual(notifications)
        })

        it('throws on server error', async () => {
            mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server error'))

            await expect(api.getNotifications()).rejects.toThrow()
        })
    })

    describe('markAsRead', () => {
        it('sends PATCH to /users/notifications/:id/read', async () => {
            mockFetch.mockResolvedValueOnce(okResponse())

            await api.markAsRead(42)

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, init] = mockFetch.mock.calls[0]
            expect(url).toContain('/users/notifications/42/read')
            expect(init.method).toBe('PATCH')
        })
    })

    describe('markAllAsRead', () => {
        it('sends POST to /users/notifications/read-all', async () => {
            mockFetch.mockResolvedValueOnce(okResponse())

            await api.markAllAsRead()

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, init] = mockFetch.mock.calls[0]
            expect(url).toContain('/users/notifications/read-all')
            expect(init.method).toBe('POST')
        })
    })

    describe('deleteNotification', () => {
        it('sends DELETE to /users/notifications/:id', async () => {
            mockFetch.mockResolvedValueOnce(okResponse())

            await api.deleteNotification(99)

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, init] = mockFetch.mock.calls[0]
            expect(url).toContain('/users/notifications/99')
            expect(init.method).toBe('DELETE')
        })

        it('URL-encodes the notification id', async () => {
            mockFetch.mockResolvedValueOnce(okResponse())

            await api.deleteNotification(123)

            const url = mockFetch.mock.calls[0][0]
            expect(url).toContain('123')
        })
    })

    describe('clearAllNotifications', () => {
        it('sends DELETE to /users/notifications', async () => {
            mockFetch.mockResolvedValueOnce(okResponse())

            await api.clearAllNotifications()

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, init] = mockFetch.mock.calls[0]
            expect(url).toContain('/users/notifications')
            expect(init.method).toBe('DELETE')
        })
    })
})
