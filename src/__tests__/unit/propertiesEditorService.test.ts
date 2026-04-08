jest.mock('@/lib/api/client', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
    },
}))

jest.mock('@/lib/propertiesApi', () => ({
    normalizeProperty: jest.fn((value) => value),
}))

describe('propertiesEditorService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    it('fetchEditableProperty() unwraps property payload', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { fetchEditableProperty } = await import('@/lib/propertiesEditorService')
        ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ id: 10, title: 'Imóvel' })

        const result = await fetchEditableProperty('10')

        expect(result).toEqual({ id: 10, title: 'Imóvel' })
        expect(apiClient.get).toHaveBeenCalledWith('/properties/10')
    })

    it('saveEditedProperty() delegates to edit-request endpoint', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { saveEditedProperty } = await import('@/lib/propertiesEditorService')
        ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ requestId: 42 })

        const payload = { title: 'Atualizado' }
        await saveEditedProperty(10, payload, 'broker')

        expect(apiClient.post).toHaveBeenCalledWith('/properties/10/edit-requests', payload)
    })
})
