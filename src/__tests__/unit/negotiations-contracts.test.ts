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

describe('negotiations API', () => {
    let negotiations: typeof import('@/lib/api/negotiations')

    beforeEach(async () => {
        jest.resetModules()
        negotiations = await import('@/lib/api/negotiations')
    })

    it('createProposal() sends POST to /negotiations/proposal', async () => {
        const response = { negotiation: { id: 'neg-123', propertyId: 1, status: 'PROPOSAL_SENT' } }
        mockFetch.mockResolvedValueOnce(okResponse(response))

        const result = await negotiations.createProposal({
            propertyId: 1,
            payment: { dinheiro: 500000, financiamento: 0, permuta: 0, outros: 0 },
            clientName: 'Test',
            clientCpf: '12345678900',
        })

        expect(result.negotiation.id).toBe('neg-123')
        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/negotiations/proposal')
        expect(init.method).toBe('POST')
    })

    it('uploadSignedProposal() sends FormData with file', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        const file = new File(['signed pdf content'], 'proposta-assinada.pdf', { type: 'application/pdf' })
        await negotiations.uploadSignedProposal('neg-123', file)

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/negotiations/neg-123/proposals/signed')
        expect(init.body).toBeInstanceOf(FormData)
    })
})

describe('contracts API', () => {
    let contracts: typeof import('@/lib/api/contracts')

    beforeEach(async () => {
        jest.resetModules()
        contracts = await import('@/lib/api/contracts')
    })

    it('uploadContractDocument() includes side and documentType in FormData', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        const file = new File(['doc'], 'id.pdf', { type: 'application/pdf' })
        await contracts.uploadContractDocument({
            contractId: 'contract-xyz',
            side: 'seller',
            documentType: 'doc_identidade',
            file,
        })

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/contracts/contract-xyz/documents')
        const formData = init.body as FormData
        expect(formData.get('side')).toBe('seller')
        expect(formData.get('documentType')).toBe('doc_identidade')
    })

    it('buildNegotiationDocumentDownloadUrl() encodes IDs', () => {
        const url = contracts.buildNegotiationDocumentDownloadUrl('neg with spaces', 42)
        expect(url).toContain(encodeURIComponent('neg with spaces'))
        expect(url).toContain('/42/')
    })

    it('getContractById() encodes contractId in URL', async () => {
        const mockContract = { id: 'abc', negotiationId: 'def', documents: [] }
        mockFetch.mockResolvedValueOnce(okResponse(mockContract))

        await contracts.getContractById('id/with/slashes')

        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain(encodeURIComponent('id/with/slashes'))
    })
})
