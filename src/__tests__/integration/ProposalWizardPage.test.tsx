import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProposalWizardPage from '@/app/propostas/nova/page'
import { createProposal, fetchProposalTargetProperty, updateProposalDraft } from '@/lib/negotiationsService'
import { useUser } from '@/contexts/UserContext'

const push = jest.fn()
const replace = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push, replace }),
    useSearchParams: () => new URLSearchParams('propertyId=10'),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: jest.fn(),
}))

jest.mock('@/lib/auth/routeResolution', () => ({
    resolveOperationalGateRoute: jest.fn(() => null),
}))

jest.mock('@/lib/negotiationsService', () => ({
    createProposal: jest.fn(),
    fetchMyNegotiationById: jest.fn(),
    fetchProposalTargetProperty: jest.fn(),
    searchUsers: jest.fn(),
    updateProposalDraft: jest.fn(),
}))

jest.mock('@/components/form/CurrencyInput', () => ({
    CurrencyInput: ({ value, onChange, ...props }: { value: string; onChange: (next: string) => void; [key: string]: unknown }) => (
        <input {...props} value={value} onChange={(event) => onChange((event.target as HTMLInputElement).value)} />
    ),
}))

jest.mock('lucide-react', () => ({
    ArrowLeft: () => <span />,
    ArrowRight: () => <span />,
    Loader2: () => <span />,
    FileText: () => <span />,
    User: () => <span />,
    CreditCard: () => <span />,
    DollarSign: () => <span />,
    Percent: () => <span />,
    Wand2: () => <span />,
    CheckCircle: () => <span />,
    AlertTriangle: () => <span />,
    Home: () => <span />,
    ChevronRight: () => <span />,
    ShieldCheck: () => <span />,
}))

jest.mock('next/link', () => {
    function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
    MockLink.displayName = 'MockLink'
    return MockLink
})

const mockSession = {
    user: {
        id: 1,
        role: 'client',
        name: 'Cliente Teste',
        email: 'cliente@example.com',
    },
}

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

describe('ProposalWizardPage', () => {
    beforeEach(() => {
        push.mockReset()
        replace.mockReset()
        window.confirm = jest.fn(() => true)
        ;(useUser as jest.Mock).mockReturnValue({
            session: mockSession,
            loading: false,
            isBroker: false,
            isAuxiliaryAdministrative: false,
        })
        ;(fetchProposalTargetProperty as jest.Mock).mockResolvedValue(property)
        ;(createProposal as jest.Mock).mockResolvedValue({ negotiation: { id: 'neg-1' } })
        ;(updateProposalDraft as jest.Mock).mockResolvedValue(undefined)
    })

    it('envia validadeDias no payload da rota ativa', async () => {
        render(<ProposalWizardPage />)

        await screen.findByRole('heading', { name: 'Gerar Proposta' })
        const nameInput = await screen.findByDisplayValue('Cliente Teste')
        fireEvent.change(nameInput, { target: { value: 'Cliente Alterado' } })
        fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '52998224725' } })
        fireEvent.click(screen.getByRole('button', { name: 'Aluguel' }))
        const baseLabel = screen.getByText(/Valor base selecionado:/)
        expect(baseLabel.parentElement?.textContent).toContain('R$')
        expect(baseLabel.parentElement?.textContent).toContain('2.000,00')
        fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))

        await screen.findByRole('button', { name: 'Gerar Proposta' })
        fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '2000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Gerar Proposta' }))

        await waitFor(() => expect(createProposal).toHaveBeenCalled())
        expect(createProposal).toHaveBeenCalledWith(expect.objectContaining({
            propertyId: 10,
            clientName: 'Cliente Alterado',
            clientCpf: '52998224725',
            buyerEmail: 'cliente@example.com',
            validadeDias: 10,
            dealType: 'rent',
            proposalValue: 2000,
        }))
        expect(window.confirm).toHaveBeenCalledWith('A proposta continua editável até a assinatura. Confirmar geração do PDF agora?')
        expect(push).toHaveBeenCalledWith('/propostas?created=1')
    })
})


