jest.mock('@/lib/api/client', () => ({
    apiClient: {
        put: jest.fn(),
    },
}))

describe('propertiesEditorService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    it('fetchEditableProperty() unwraps property payload', async () => {
        const { fetchEditableProperty } = await import('@/lib/propertiesEditorService')
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ data: { id: 10, title: 'Imóvel' } }),
        })

        const result = await fetchEditableProperty('10')

        expect(result).toEqual({ id: 10, title: 'Imóvel' })
    })

    it('saveEditedProperty() delegates to apiClient.put', async () => {
        const { apiClient } = await import('@/lib/api/client')
        const { saveEditedProperty } = await import('@/lib/propertiesEditorService')
        ;(apiClient.put as jest.Mock).mockResolvedValueOnce(undefined)

        const payload = { title: 'Atualizado' }
        await saveEditedProperty(10, payload)

        expect(apiClient.put).toHaveBeenCalledWith('/properties/10', payload)
    })
})
