/**
 * Tests for CloseDealDialog component
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CloseDealDialog from '@/components/property/CloseDealDialog'
import { closePropertyDeal } from '@/lib/propertyDeals'
import { Property } from '@/types/property'

// Proxy mock for lucide-react (handles any icon import dynamically)
jest.mock('lucide-react', () => new Proxy({}, {
    get: (_t, prop: string) => {
        const C = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
        C.displayName = prop
        return C
    },
}))

jest.mock('@/lib/propertyDeals', () => ({
    closePropertyDeal: jest.fn().mockResolvedValue({ status: 'sold' }),
    cancelPropertyDeal: jest.fn().mockResolvedValue({ status: 'approved' }),
}))

const mockProperty: Property = {
    id: 42,
    title: 'Casa Teste',
    description: 'Desc',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda e Aluguel',
    price: 500000,
    priceSale: 500000,
    priceRent: 3000,
    address: 'Rua A',
    city: 'Goiânia',
    state: 'GO',
    images: [],
    createdAt: new Date().toISOString(),
}

describe('CloseDealDialog', () => {
    const onClose = jest.fn()
    const onDealClosed = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock HTMLDialogElement methods not available in jsdom
        HTMLDialogElement.prototype.showModal = jest.fn()
        HTMLDialogElement.prototype.close = jest.fn()
    })

    it('renders nothing when open=false', () => {
        const { container } = render(
            <CloseDealDialog property={mockProperty} open={false} onClose={onClose} onDealClosed={onDealClosed} />
        )
        expect(container.innerHTML).toBe('')
    })

    it('renders the dialog when open=true', () => {
        render(
            <CloseDealDialog property={mockProperty} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        // Title "Fechar negócio" shown in heading and submit button
        expect(screen.getAllByText(/Fechar negócio/i).length).toBeGreaterThanOrEqual(1)
    })

    it('shows Venda and Aluguel type buttons for dual-purpose property', () => {
        render(
            <CloseDealDialog property={mockProperty} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        expect(screen.getByText('Venda')).toBeInTheDocument()
        expect(screen.getByText('Aluguel')).toBeInTheDocument()
    })

    it('shows amount and commission fields', () => {
        render(
            <CloseDealDialog property={mockProperty} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        expect(screen.getByText('Valor final')).toBeInTheDocument()
        expect(screen.getByText('Comissão')).toBeInTheDocument()
    })

    it('calls onClose when X button is clicked', () => {
        render(
            <CloseDealDialog property={mockProperty} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        // The X icon button is inside the header
        const xIcon = screen.getByTestId('icon-x')
        const closeBtn = xIcon.closest('button')!
        fireEvent.click(closeBtn)
        expect(onClose).toHaveBeenCalled()
    })

    it('shows cancel deal button for sold properties', () => {
        const sold: Property = { ...mockProperty, status: 'sold' }
        render(
            <CloseDealDialog property={sold} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        expect(screen.getByText(/Cancelar negócio/)).toBeInTheDocument()
    })

    it('shows "Atualizar negócio" for already-closed deals', () => {
        const rented: Property = { ...mockProperty, status: 'rented' }
        render(
            <CloseDealDialog property={rented} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )
        // heading + submit button
        expect(screen.getAllByText(/Atualizar negócio/).length).toBeGreaterThanOrEqual(1)
    })

    it('submits deal via closePropertyDeal()', async () => {
        const mockedClosePropertyDeal = closePropertyDeal as jest.MockedFunction<typeof closePropertyDeal>
        mockedClosePropertyDeal.mockResolvedValue({ status: 'sold' } as never)

        render(
            <CloseDealDialog property={mockProperty} open={true} onClose={onClose} onDealClosed={onDealClosed} />
        )

        // Click the submit button
        const submitBtn = screen.getByText(/Fechar negócio/i, { selector: 'button' })
        fireEvent.click(submitBtn)

        await waitFor(() => {
            expect(mockedClosePropertyDeal).toHaveBeenCalledWith(
                42,
                expect.objectContaining({
                    type: 'sale',
                    amount: expect.any(Number),
                    commission_rate: expect.any(Number),
                })
            )
        })
    })
})
