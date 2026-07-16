import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import { MyProcessesHub } from './MyProcessesHub'
import { fetchMyNegotiations } from '@/lib/negotiationsService'
import { getMyContracts } from '@/lib/api/contracts'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('next/link', () => {
    function MockNextLink({ children, href, ...rest }: { children: React.ReactNode; href: string }) {
        return <a href={href} {...rest}>{children}</a>
    }
    return MockNextLink
})

jest.mock('lucide-react', () => new Proxy({}, {
    get: (_target, prop: string) => {
        const Component = (props: Record<string, unknown>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />
        Component.displayName = prop
        return Component
    },
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: { user: { id: 42, name: 'Maria Cliente', role: 'client' } },
        loading: false,
    }),
}))

jest.mock('@/lib/auth/routeResolution', () => ({
    resolveOperationalGateRoute: () => null,
}))

jest.mock('@/lib/negotiationsService', () => ({
    fetchMyNegotiations: jest.fn(),
}))

jest.mock('@/lib/api/contracts', () => ({
    getMyContracts: jest.fn(),
}))

describe('MyProcessesHub', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(fetchMyNegotiations as jest.Mock).mockResolvedValue([
            { id: 'active', propertyId: 1, propertyTitle: 'Casa A', status: 'PROPOSAL_SENT' },
            { id: 'refused', propertyId: 2, propertyTitle: 'Casa B', status: 'PROPOSAL_REFUSED' },
        ])
        ;(getMyContracts as jest.Mock).mockResolvedValue([
            {
                id: 'active-contract',
                negotiationId: 'active',
                propertyId: 1,
                propertyTitle: 'Casa A',
                status: 'AWAITING_DOCS',
                viewerSide: 'buyer',
                documentProgress: {
                    buyer: { totals: { pending: 2 } },
                    seller: { totals: { pending: 6 } },
                },
            },
            {
                id: 'history-contract',
                negotiationId: 'history',
                propertyId: 3,
                propertyTitle: 'Casa Finalizada',
                status: 'FINALIZED',
            },
            {
                id: 'cancelled-contract',
                negotiationId: 'cancelled',
                propertyId: 4,
                propertyTitle: 'Casa Cancelada',
                status: 'CANCELLED',
            },
        ])
    })

    it('exibe o hub canônico com pendências do próprio lado e histórico recolhido', async () => {
        render(<MyProcessesHub />)

        expect(await screen.findByText('Meus Processos')).toBeInTheDocument()
        expect(await screen.findByRole('link', { name: /propostas/i })).toHaveAttribute('href', '/meus-processos/propostas')
        expect(await screen.findByRole('link', { name: /contratos/i })).toHaveAttribute('href', '/meus-processos/contratos')

        await waitFor(() => {
            expect(screen.getByText('1 em andamento')).toBeInTheDocument()
            expect(screen.getByText('2 documentos pendentes')).toBeInTheDocument()
        })
        expect(screen.getByText('Histórico de Processos (1)')).toBeInTheDocument()
        expect(screen.getByText('Casa Finalizada')).toBeInTheDocument()
        expect(screen.queryByText('Casa Cancelada')).not.toBeInTheDocument()
    })
})
