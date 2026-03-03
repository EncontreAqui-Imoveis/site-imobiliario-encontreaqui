/**
 * Integration test: Reports page
 * Tests summary cards, status breakdown, commission history, and loading/error states
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = (p: Record<string, unknown>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...p} />
            Comp.displayName = prop
            return Comp
        },
    })
})

jest.mock('@/lib/api/broker', () => ({
    getMyPerformanceReport: jest.fn(),
    getMyCommissions: jest.fn(),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: { user: { id: 1, name: 'João', email: 'joao@test.com' } },
        loading: false,
        isBroker: true,
    }),
}))

// Import AFTER mocks
import RelatoriosPage from '@/app/relatorios/page'
import { getMyPerformanceReport, getMyCommissions } from '@/lib/api/broker'

const mockedGetReport = getMyPerformanceReport as jest.Mock
const mockedGetCommissions = getMyCommissions as jest.Mock

// Test data
const mockReport = {
    totalSales: 5,
    totalRentals: 12,
    totalCommissionEarned: 85000,
    totalPropertiesListed: 30,
    activeNegotiations: 3,
    statusBreakdown: {
        approved: 18,
        pending_approval: 5,
        rejected: 2,
        rented: 3,
        sold: 2,
    },
    monthlyBreakdown: [
        { month: 'Jan/2026', sales: 2, rentals: 4, commissions: 25000 },
        { month: 'Fev/2026', sales: 3, rentals: 8, commissions: 60000 },
    ],
}

const mockCommissions = [
    {
        role: 'SELLING' as const,
        amount: 15000,
        status: 'PAID' as const,
        negotiationId: 'neg-1',
        propertyTitle: 'Casa em Jardins',
        dealType: 'sale',
        salePrice: 500000,
        commissionRate: 3,
        commissionCycles: 1,
        commissionAmountTotal: 15000,
        saleDate: '2026-01-15',
    },
    {
        role: 'CAPTURING' as const,
        amount: 2000,
        status: 'PENDING' as const,
        negotiationId: 'neg-2',
        propertyTitle: 'Apartamento Centro',
        dealType: 'rent',
        salePrice: 3000,
        commissionRate: 10,
        commissionCycles: 6,
        commissionAmountTotal: 12000,
        recurrenceInterval: 'monthly',
        isRecurring: true,
        saleDate: '2026-02-01',
    },
]

describe('Reports Page - Integration', () => {
    beforeEach(() => {
        mockedGetReport.mockReset().mockResolvedValue(mockReport)
        mockedGetCommissions.mockReset().mockResolvedValue(mockCommissions)
        mockPush.mockClear()
        mockReplace.mockClear()
    })

    it('renders summary cards with correct values', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getAllByText('Vendas').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Aluguéis').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Imóveis').length).toBeGreaterThan(0)
        })
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('30')).toBeInTheDocument()
        expect(screen.getByText(/R\$\s?85\.000/)).toBeInTheDocument()
    })

    it('renders status breakdown chips', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Status dos imóveis')).toBeInTheDocument()
        })

        expect(screen.getByText('Disponíveis')).toBeInTheDocument()
        expect(screen.getByText('Em análise')).toBeInTheDocument()
        expect(screen.getByText('Rejeitados')).toBeInTheDocument()
        expect(screen.getByText('Alugados')).toBeInTheDocument()
        expect(screen.getByText('Vendidos')).toBeInTheDocument()
    })

    it('renders monthly breakdown table', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('VGV Mensal')).toBeInTheDocument()
        })

        expect(screen.getByText('Jan/2026')).toBeInTheDocument()
        expect(screen.getByText('Fev/2026')).toBeInTheDocument()
    })

    it('renders commission history with deal type badges', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Casa em Jardins')).toBeInTheDocument()
        })

        expect(screen.getByText('Apartamento Centro')).toBeInTheDocument()
        expect(screen.getByText('Pago')).toBeInTheDocument()
        expect(screen.getByText('Pendente')).toBeInTheDocument()
    })

    it('expands commission tile to show details', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Casa em Jardins')).toBeInTheDocument()
        })

        const tile = screen.getByText('Casa em Jardins').closest('button')!
        fireEvent.click(tile)

        await waitFor(() => {
            expect(screen.getByText('Valor do negócio')).toBeInTheDocument()
            expect(screen.getByText('Taxa de comissão')).toBeInTheDocument()
            expect(screen.getByText('3.00%')).toBeInTheDocument()
        })
    })

    it('shows recurrence badge for recurring commissions', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Mensal')).toBeInTheDocument()
        })
    })

    it('shows empty state when no commissions', async () => {
        mockedGetCommissions.mockResolvedValue([])

        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Nenhuma comissão registrada ainda.')).toBeInTheDocument()
        })
    })

    it('degrades gracefully on API failure', async () => {
        mockedGetReport.mockRejectedValue(new Error('API error'))
        mockedGetCommissions.mockRejectedValue(new Error('API error'))

        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Histórico de comissões')).toBeInTheDocument()
        })

        expect(screen.getByText('Nenhuma comissão registrada ainda.')).toBeInTheDocument()
    })

    it('has a refresh button that re-fetches data', async () => {
        render(<RelatoriosPage />)

        await waitFor(() => {
            expect(screen.getByText('Atualizar')).toBeInTheDocument()
        })
        const initialCalls = mockedGetReport.mock.calls.length

        fireEvent.click(screen.getByText('Atualizar'))

        await waitFor(() => {
            expect(mockedGetReport.mock.calls.length).toBeGreaterThan(initialCalls)
        })
    })
})
