const mockApiGet = jest.fn()
const mockApiPost = jest.fn()

jest.mock('@/lib/api/client', () => ({
    API_BASE_URL: 'https://api.example.test',
    apiClient: {
        get: (...args: unknown[]) => mockApiGet(...args),
        post: (...args: unknown[]) => mockApiPost(...args),
    },
}))

import {
    getMyContracts,
    normalizeContractDocument,
    normalizeDocumentRequirements,
    reviewContractDraft,
    verifyContractHandshakePin,
} from './contracts'

describe('contracts api normalization', () => {
    beforeEach(() => {
        mockApiGet.mockReset()
        mockApiPost.mockReset()
    })

    it('normaliza reviewReason e validationResult do documento', () => {
        const normalized = normalizeContractDocument({
            id: 10,
            negotiationId: 'neg-10',
            type: 'other',
            documentType: 'doc_identidade',
            side: 'seller',
            documentCategory: 'identidade',
            categoryStatus: 'REJECTED',
            reviewReason: 'Documento ilegível',
            validationResult: {
                isValid: false,
                status: 'REJECTED',
                issues: [{ code: 'FILE_TOO_SMALL', message: 'Arquivo inválido' }],
            },
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        expect(normalized).not.toBeNull()
        expect(normalized?.reviewReason).toBe('Documento ilegível')
        expect((normalized?.validationResult as { status?: string } | null)?.status).toBe('REJECTED')
    })

    it('preserva APPROVED_WITH_RES no status categorial', () => {
        const normalized = normalizeContractDocument({
            id: 11,
            negotiationId: 'neg-11',
            type: 'other',
            documentType: 'doc_identidade',
            side: 'buyer',
            documentCategory: 'identidade',
            categoryStatus: 'APPROVED_WITH_RES',
            createdAt: '2026-01-01T00:00:00.000Z',
        })

        expect(normalized).not.toBeNull()
        expect(normalized?.categoryStatus).toBe('APPROVED_WITH_RES')
    })

    it('normaliza documentRequirements (matriz de categorias)', () => {
        const out = normalizeDocumentRequirements({
            seller: [
                {
                    category: 'identidade',
                    applicability: 'required',
                    required: true,
                    reasonCode: 'IDENTIDADE_REQUIRED',
                },
            ],
            buyer: [],
        })

        expect(out).not.toBeNull()
        expect(out?.seller).toHaveLength(1)
        expect(out?.seller[0]?.category).toBe('identidade')
        expect(out?.buyer).toEqual([])
    })

    it('documentRequirements vazio retorna null', () => {
        expect(normalizeDocumentRequirements({ seller: [], buyer: [] })).toBeNull()
    })

    it('remove contratos cancelados da listagem comum, inclusive status legado', async () => {
        mockApiGet.mockResolvedValueOnce([
            {
                id: 'cancelled',
                negotiationId: 'neg-cancelled',
                propertyId: 1,
                status: 'CANCELLED',
            },
            {
                id: 'legacy-cancelled',
                negotiationId: 'neg-legacy-cancelled',
                propertyId: 2,
                status: 'CANCELADO',
            },
            {
                id: 'active',
                negotiationId: 'neg-active',
                propertyId: 3,
                status: 'AWAITING_DOCS',
            },
        ])

        await expect(getMyContracts()).resolves.toEqual([
            expect.objectContaining({ id: 'active' }),
        ])
        expect(mockApiGet).toHaveBeenCalledWith('/contracts/me')
    })

    it('envia o PIN e normaliza o contrato liberado pelo handshake', async () => {
        mockApiPost.mockResolvedValueOnce({
            contract: {
                id: 'contract-verified',
                negotiationId: 'neg-verified',
                propertyId: 3,
                status: 'AWAITING_DOCS',
                capabilities: {
                    canReadMeta: true,
                    canReadSeller: false,
                    canEditSeller: false,
                    canReadBuyer: true,
                    canEditBuyer: true,
                    canReadDocumentStatus: true,
                    canReadDocumentFiles: true,
                    canMutateDocuments: true,
                    isReadOnly: false,
                },
                handshake: { status: 'VERIFIED', requiresVerification: false },
            },
            documents: [],
        })

        await expect(verifyContractHandshakePin('contract-verified', '1234')).resolves.toEqual(
            expect.objectContaining({
                id: 'contract-verified',
                handshake: { status: 'VERIFIED', requiresVerification: false },
            }),
        )
        expect(mockApiPost).toHaveBeenCalledWith('/contracts/contract-verified/verify-pin', { pin: '1234' })
    })

    it('envia a conferência da minuta e normaliza a decisão do lado atual', async () => {
        mockApiPost.mockResolvedValueOnce({
            contract: {
                id: 'contract-review',
                negotiationId: 'neg-review',
                propertyId: 5,
                status: 'AWAITING_MINUTE_REVIEW',
                draftReview: {
                    revisionId: 91,
                    revisionNumber: 2,
                    documentId: 16,
                    originalFileName: 'minuta-v2.pdf',
                    canReview: false,
                    viewerDecision: 'CONSENTED',
                    viewerReason: null,
                    allConsented: false,
                },
            },
            documents: [],
        })

        await expect(reviewContractDraft({
            contractId: 'contract-review',
            decision: 'CONSENTED',
        })).resolves.toEqual(expect.objectContaining({
            status: 'AWAITING_MINUTE_REVIEW',
            draftReview: expect.objectContaining({
                revisionId: 91,
                viewerDecision: 'CONSENTED',
            }),
        }))
        expect(mockApiPost).toHaveBeenCalledWith('/contracts/contract-review/draft-review', {
            decision: 'CONSENTED',
        })
    })
})
