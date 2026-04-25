import { normalizeContractDocument, normalizeDocumentRequirements } from './contracts'

describe('contracts api normalization', () => {
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
})
