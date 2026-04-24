import { render, screen } from '@testing-library/react'

import { ContractList } from './ContractList'
import type { ContractSummary } from '@/types/contract'

describe('ContractList', () => {
    it('mostra resumo de pendencias documentais por categoria', () => {
        const contracts: ContractSummary[] = [
            {
                id: 'c-1',
                negotiationId: 'n-1',
                propertyId: 10,
                status: 'AWAITING_DOCS',
                sellerApprovalStatus: 'PENDING',
                buyerApprovalStatus: 'PENDING',
                createdAt: '2026-01-01T00:00:00.000Z',
                propertyTitle: 'Casa teste',
                documentProgress: {
                    seller: {
                        side: 'seller',
                        categories: [],
                        totals: { pending: 2, approved: 0, rejected: 0 },
                    },
                    buyer: {
                        side: 'buyer',
                        categories: [],
                        totals: { pending: 1, approved: 0, rejected: 0 },
                    },
                },
            },
        ]

        render(<ContractList contracts={contracts} />)

        expect(screen.getByText('3 categorias pendentes')).toBeInTheDocument()
    })
})
