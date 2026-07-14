import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ProposalWizard } from '@/components/proposals/ProposalWizard'

const replace = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace }),
}))

const property = {
    id: 10,
    title: 'Casa Teste',
    price: 1000,
    priceSale: 1000,
    priceRent: 2000,
    status: 'approved',
    ownerId: 2,
    brokerId: 3,
} as never

describe('ProposalWizard', () => {
    beforeEach(() => {
        replace.mockReset()
    })

    it('redireciona para o fluxo novo de propostas', async () => {
        render(<ProposalWizard property={property} />)

        expect(screen.getByText(/Redirecionando para o fluxo novo/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(replace).toHaveBeenCalledWith('/propostas/nova?propertyId=10')
        })
    })
})
