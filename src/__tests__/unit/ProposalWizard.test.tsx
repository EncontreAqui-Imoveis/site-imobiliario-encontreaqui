import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProposalWizard } from '@/components/proposals/ProposalWizard'
import { apiClient } from '@/lib/api/client'

const push = jest.fn()
const replace = jest.fn()

jest.mock('@/lib/api/client', () => ({
    ApiError: class MockApiError extends Error {
        constructor(message = '') {
            super(message)
            this.status = undefined
            this.payload = undefined
        }
    },
    apiClient: {
        post: jest.fn(),
    },
}))

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push, replace }),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: {
            user: {
                id: 1,
                role: 'client',
                name: 'Cliente Teste',
            },
        },
        loading: false,
    }),
}))

jest.mock('@/components/form/CurrencyInput', () => ({
    CurrencyInput: ({ value, onChange, ...props }: { value: string; onChange: (next: string) => void; [key: string]: unknown }) => (
        <input {...props} value={value} onChange={(event) => onChange((event.target as HTMLInputElement).value)} />
    ),
}))

jest.mock('lucide-react', () => ({
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
    ArrowLeft: () => <span />,
    ArrowRight: () => <span />,
}))

jest.mock('next/link', () => {
    function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
    MockLink.displayName = 'MockLink'
    return MockLink
})

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
        push.mockReset()
        replace.mockReset()
        ;(apiClient.post as jest.Mock).mockReset()
        ;(apiClient.post as jest.Mock).mockResolvedValue({ negotiation: { id: 'neg-1' } })
    })

    it('envia validadeDias no payload final', async () => {
        render(<ProposalWizard property={property} />)

        const nameInput = await screen.findByDisplayValue('Cliente Teste')
        fireEvent.change(nameInput, { target: { value: 'Cliente Alterado' } })
        fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '52998224725' } })
        fireEvent.click(screen.getByRole('button', { name: 'Aluguel' }))
        const baseLabel = screen.getByText(/Valor base selecionado:/)
        expect(baseLabel.parentElement?.textContent).toContain('R$')
        expect(baseLabel.parentElement?.textContent).toContain('2.000,00')
        fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))

        fireEvent.change(screen.getAllByPlaceholderText('R$ 0,00')[0], { target: { value: '200000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))

        await waitFor(() => expect(screen.getByRole('button', { name: 'Gerar proposta' })).toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'Gerar proposta' }))

        await waitFor(() => expect(apiClient.post).toHaveBeenCalled())
        const [, body] = (apiClient.post as jest.Mock).mock.calls[0]
        expect(body).toEqual(expect.objectContaining({
            propertyId: 10,
            clientName: 'Cliente Alterado',
            clientCpf: '52998224725',
            validadeDias: 10,
        }))
        expect(push).toHaveBeenCalledWith('/propostas/neg-1/upload-assinada')
    })
})
