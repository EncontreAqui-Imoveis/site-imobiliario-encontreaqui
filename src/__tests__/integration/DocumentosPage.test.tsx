import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import DocumentosPage from '@/app/documentos/page'

import { fetchMyNegotiations } from '@/lib/negotiationsService'
import { getMyContracts } from '@/lib/api/contracts'

const mockReplace = jest.fn()
let searchParams = new URLSearchParams('tab=propostas')

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
    useSearchParams: () => searchParams,
}))

jest.mock('next/link', () => {
    function MockNextLink({
        children,
        href,
        ...rest
    }: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
    }) {
        return (
            <a href={href} {...rest}>
                {children}
            </a>
        )
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = (props: Record<string, unknown>) => <span data-testid={`icon-${String(prop).toLowerCase()}`} {...props} />
            Comp.displayName = prop
            return Comp
        },
    })
})

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: {
            user: {
                id: 42,
                name: 'Maria Cliente',
                role: 'client',
            },
        },
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

describe('Documentos page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(fetchMyNegotiations as jest.Mock).mockResolvedValue([
            {
                id: 'neg-1',
                propertyId: 100,
                propertyTitle: 'Casa de Teste',
                status: 'PROPOSAL_SENT',
                clientName: 'Maria',
                createdAt: '2026-01-01T10:00:00.000Z',
                updatedAt: '2026-01-02T10:00:00.000Z',
            },
        ])
        ;(getMyContracts as jest.Mock).mockResolvedValue([
            {
                id: 88,
                propertyTitle: 'Apartamento Contratado',
                status: 'ASSINADO',
                negotiationId: 'neg-2',
            },
        ])
    })

    it('carrega e exibe propostas por padrão', async () => {
        render(<DocumentosPage />)

        expect(screen.getByText('Documentos')).toBeInTheDocument()
        expect(await screen.findByText('Casa de Teste')).toBeInTheDocument()

        expect(screen.getByText('Pendente de assinatura')).toBeInTheDocument()
        expect(screen.getByText('Enviar proposta assinada')).toBeInTheDocument()
    })

    it('carrega e exibe contratos quando tab=contratos', async () => {
        searchParams = new URLSearchParams('tab=contratos')
        render(<DocumentosPage />)
        await waitFor(() => {
            expect(screen.getByText('Apartamento Contratado')).toBeInTheDocument()
            expect(screen.getByText('Status: ASSINADO')).toBeInTheDocument()
        })
    })
})
