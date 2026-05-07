import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import AnunciePage from '@/app/anuncie/page'
import { TEAM_CONTACT_CHANNEL_URL, TEAM_CONTACT_PHONE } from '@/lib/contactLinks'

const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
}

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => new URLSearchParams(),
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

const mockClientSession = {
    user: {
        id: 10,
        name: 'Cliente Teste',
        role: 'client',
        email: 'cliente@test.com',
    },
}

const mockBrokerPendingSession = {
    user: {
        id: 20,
        name: 'Broker Pendente',
        role: 'broker',
        email: 'brokerpendente@teste.com',
        broker_status: 'pending_verification' as const,
        email_verified: true,
    },
}

let mockUserContextValue = {
    session: mockClientSession,
}

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: mockUserContextValue.session,
        loading: false,
    }),
}))

jest.mock('@/lib/negotiationsService')
jest.mock('@/lib/api/user', () => ({
    createProperty: jest.fn(),
}))

beforeEach(() => {
    jest.clearAllMocks()
    mockUserContextValue = {
        session: mockClientSession,
    }
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
    }) as jest.Mock
})

describe('Anuncie flow', () => {
    beforeEach(() => {
        mockRouter.push.mockClear()
        mockRouter.replace.mockClear()
        mockRouter.back.mockClear()
    })

    it('exibe o fluxo em duas perguntas e avança para o formulário com proprietário', async () => {
        render(<AnunciePage />)

        expect(await screen.findByText('Como você quer anunciar?')).toBeInTheDocument()
        expect(await screen.findByText('Anunciar você mesmo')).toBeInTheDocument()
        expect(screen.getByText('Entrar em contato com a equipe')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Anunciar você mesmo'))
        expect(await screen.findByText('Você é proprietário do imóvel?')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Sim, sou proprietário'))
        expect(await screen.findByText('Cadastrar imóvel')).toBeInTheDocument()
        expect(screen.getByText('Fluxo de cliente-proprietário')).toBeInTheDocument()
        expect(screen.queryByText('Como você quer anunciar?')).not.toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
    })

    it('permite broker pendente seguir como proprietário sem entrar no fluxo profissional', async () => {
        mockUserContextValue = {
            session: mockBrokerPendingSession,
        }
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        expect(await screen.findByText('Cadastrar imóvel')).toBeInTheDocument()
        expect(screen.getByText('Fluxo de cliente-proprietário')).toBeInTheDocument()
        expect(mockRouter.push).not.toHaveBeenCalledWith('/onboarding/broker')
        expect(mockRouter.replace).not.toHaveBeenCalledWith('/onboarding/broker')
    })

    it('mostra aviso quando seleciona "Não, quero anunciar de outra pessoa"', async () => {
        mockUserContextValue = {
            session: mockBrokerPendingSession,
        }
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Não, quero anunciar de outra pessoa'))

        expect(await screen.findByText('Não é possível continuar este fluxo')).toBeInTheDocument()
        expect(mockRouter.push).not.toHaveBeenCalledWith('/onboarding/broker')
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('permite apenas voltar no fluxo de anúncio de outra pessoa', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Não, quero anunciar de outra pessoa'))

        fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }))
        expect(screen.getByText('Como você quer anunciar?')).toBeInTheDocument()
        expect(screen.getByText('Anunciar você mesmo')).toBeInTheDocument()
    })

    it('expõe o contato da equipe no primeiro passo', async () => {
        render(<AnunciePage />)

        const contact = await screen.findByText('Entrar em contato com a equipe')
        fireEvent.click(contact)
        expect(await screen.findByText('Entre em contato com a equipe')).toBeInTheDocument()
        expect(await screen.findByText(new RegExp(TEAM_CONTACT_PHONE))).toBeInTheDocument()
        expect(await screen.findByText(/Abrir WhatsApp/)).toBeInTheDocument()
        expect(await screen.findByText('Ligar para a equipe')).toBeInTheDocument()
        expect(await screen.findByText('Copiar telefone')).toBeInTheDocument()
        expect(TEAM_CONTACT_CHANNEL_URL).toBe(`https://wa.me/${TEAM_CONTACT_PHONE}`)
    })

    it('garante que as perguntas de escolha não reaparecem após abrir formulário', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        await waitFor(() => {
            expect(screen.getByText('Cadastrar imóvel')).toBeInTheDocument()
        })
        expect(screen.queryByText('Como você quer anunciar?')).not.toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
    })

    it('valida o passo de comodidades com Energia Solar e sem "Planejados"', async () => {
        render(<AnunciePage />)

        const getFieldByLabelText = (label: string) => {
            const labelElement = screen.getByText(label)
            const control = labelElement.parentElement?.querySelector('input, textarea, select')
            if (!control) {
                throw new Error(`Campo não encontrado para o rótulo: ${label}`)
            }
            return control
        }

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        fireEvent.change(getFieldByLabelText('Tipo do imóvel *'), { target: { value: 'Casa' } })
        fireEvent.change(getFieldByLabelText('Finalidade *'), { target: { value: 'Venda' } })
        fireEvent.change(getFieldByLabelText('Título *'), { target: { value: 'Casa com energia solar' } })
        fireEvent.change(getFieldByLabelText('Descrição *'), { target: { value: 'Texto descritivo.' } })
        fireEvent.change(screen.getByPlaceholderText('R$ 0,00'), { target: { value: '120000' } })
        fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))

        fireEvent.change(getFieldByLabelText('CEP *'), { target: { value: '75900-000' } })
        fireEvent.change(getFieldByLabelText('Estado *'), { target: { value: 'GO' } })
        fireEvent.change(getFieldByLabelText('Cidade *'), { target: { value: 'Rio Verde' } })
        fireEvent.change(getFieldByLabelText('Bairro *'), { target: { value: 'Centro' } })
        fireEvent.change(getFieldByLabelText('Rua *'), { target: { value: 'Rua das Flores' } })
        fireEvent.change(getFieldByLabelText('Número *'), { target: { value: '123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))

        fireEvent.change(getFieldByLabelText('Área do terreno *'), { target: { value: '120' } })
        fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))

        fireEvent.click(screen.getByRole('checkbox', { name: 'Energia Solar' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'Poço artesiano' }))

        expect(screen.getByText('Energia Solar')).toBeInTheDocument()
        expect(screen.getByText(/Poço/i)).toBeInTheDocument()
        expect(screen.queryByText('Planejados')).not.toBeInTheDocument()
    })
})
