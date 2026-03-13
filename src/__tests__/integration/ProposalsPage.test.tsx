import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import PropostasPage from '@/app/propostas/page'

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
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: {
            user: {
                id: 1,
                name: 'Pedro',
                email: 'pedro@example.com',
            },
        },
        loading: false,
    }),
}))

jest.mock('@/lib/negotiationsService', () => ({
    fetchMyNegotiations: jest.fn().mockResolvedValue([
        {
            id: 'neg-1',
            propertyId: 101,
            propertyTitle: 'Casa Central',
            status: 'PROPOSAL_SENT',
            clientName: 'Cliente 1',
            createdAt: '2026-03-01T10:00:00.000Z',
            updatedAt: '2026-03-01T10:00:00.000Z',
            proposalValidUntil: '2026-03-11T10:00:00.000Z',
        },
        {
            id: 'neg-2',
            propertyId: 102,
            propertyTitle: 'Apartamento Azul',
            status: 'DOCUMENTATION_PHASE',
            clientName: 'Cliente 2',
            createdAt: '2026-03-02T10:00:00.000Z',
            updatedAt: '2026-03-02T10:00:00.000Z',
        },
    ]),
}))

describe('PropostasPage', () => {
    it('renders clear statuses and next-action guidance', async () => {
        render(<PropostasPage />)

        expect(await screen.findByText('Minhas Propostas')).toBeInTheDocument()
        expect(
            screen.getByText('Acompanhe aqui o ciclo da proposta: envio, análise documental, minuta, assinaturas e contrato.')
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText('Enviar proposta assinada')).toBeInTheDocument()
            expect(screen.getByText('Aguardar análise documental')).toBeInTheDocument()
        })
    })
})
