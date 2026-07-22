import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

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
    useSearchParams: () => new URLSearchParams(),
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
    deleteProposal: jest.fn(),
    downloadProposalDraft: jest.fn(),
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
            capabilities: {
                canEditProposal: true,
                canDeleteProposal: true,
                canDownloadDraft: true,
                canUploadSignedProposal: true,
                canOpenContract: false,
            },
        },
        {
            id: 'neg-2',
            propertyId: 102,
            propertyTitle: 'Apartamento Azul',
            status: 'DOCUMENTATION_PHASE',
            clientName: 'Cliente 2',
            createdAt: '2026-03-02T10:00:00.000Z',
            updatedAt: '2026-03-02T10:00:00.000Z',
            capabilities: {
                canEditProposal: false,
                canDeleteProposal: false,
                canDownloadDraft: false,
                canUploadSignedProposal: false,
                canOpenContract: false,
            },
        },
        {
            id: 'neg-3',
            propertyId: 103,
            propertyTitle: 'Casa sem capability',
            status: 'PROPOSAL_SENT',
            clientName: 'Cliente sem ação',
            createdAt: '2026-03-03T10:00:00.000Z',
            updatedAt: '2026-03-03T10:00:00.000Z',
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

        await expect(screen.findByText(/Enviar proposta assinada/i)).resolves.toBeInTheDocument()
        expect(screen.getAllByText('Pendente de assinatura')).toHaveLength(2)
        expect(screen.getAllByText('Aguardando assinatura.')).toHaveLength(2)
        expect(screen.getByLabelText('Editar proposta')).toBeInTheDocument()
        expect(screen.getByLabelText('Excluir proposta')).toBeInTheDocument()
        expect(screen.getByLabelText('Baixar minuta')).toBeInTheDocument()
        expect(screen.getAllByLabelText('Editar proposta')).toHaveLength(1)

        fireEvent.click(screen.getByRole('button', { name: 'Assinadas' }))
        await expect(screen.findByText('Em análise documental')).resolves.toBeInTheDocument()
        await expect(screen.findByText('Acompanhe o andamento da proposta')).resolves.toBeInTheDocument()
        expect(screen.queryByLabelText('Editar proposta')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Excluir proposta')).not.toBeInTheDocument()
    })
})
