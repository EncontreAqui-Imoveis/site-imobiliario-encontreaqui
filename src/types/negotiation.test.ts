import { getStatusColor, getStatusLabel } from '@/types/negotiation'

describe('negotiation status helpers', () => {
    it('maps PROPOSAL_DRAFT to readable label', () => {
        expect(getStatusLabel('PROPOSAL_DRAFT')).toBe('Proposta em Rascunho')
    })

    it('maps PROPOSAL_DRAFT to amber token classes', () => {
        expect(getStatusColor('PROPOSAL_DRAFT')).toBe('bg-amber-50 text-amber-700')
    })
})
