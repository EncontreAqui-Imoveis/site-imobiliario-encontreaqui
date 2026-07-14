import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import AnunciePage from '@/app/anuncie/page'

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
    isBroker: true,
    profileStatus: 'incomplete' as const,
}

const mockBrokerPendingDocumentsSession = {
    user: {
        id: 21,
        name: 'Broker Pendente Documentos',
        role: 'broker',
        email: 'brokerdoc@teste.com',
        broker_status: 'pending_documents',
        email_verified: true,
    },
    isBroker: true,
    profileStatus: 'incomplete' as const,
}

const mockBrokerApprovedSession = {
    user: {
        id: 22,
        name: 'Broker Aprovado',
        role: 'broker',
        email: 'brokeraprovado@teste.com',
        broker_status: 'approved' as const,
        email_verified: true,
    },
    isBroker: true,
    profileStatus: 'complete' as const,
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
    requestSupportContact: jest.fn(),
}))

beforeEach(() => {
    jest.clearAllMocks()
    mockUserContextValue = {
        session: mockClientSession,
    }
    Object.defineProperty(window, 'open', {
        configurable: true,
        writable: true,
        value: jest.fn(() => ({ location: { href: '' }, close: jest.fn() })),
    })
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

        expect(await screen.findByRole('heading', { name: 'Como você quer anunciar?' })).toBeInTheDocument()
        expect(await screen.findByText('Anunciar você mesmo')).toBeInTheDocument()
        expect(screen.getByText('Entrar em contato com a equipe')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Anunciar você mesmo'))
        expect(await screen.findByText('Você é proprietário do imóvel?')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Sim, sou proprietário'))
        expect(await screen.findByText('Cadastrar imóvel')).toBeInTheDocument()
        expect(screen.getByText('Fluxo de cliente-proprietário')).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Como você quer anunciar?' })).not.toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
        expect(screen.queryByText('Sim, continuar')).not.toBeInTheDocument()
    })

    it('volta da etapa de proprietário para a tela inicial do fluxo', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        expect(await screen.findByText('Você é proprietário do imóvel?')).toBeInTheDocument()

        fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }))

        expect(await screen.findByRole('heading', { name: 'Como você quer anunciar?' })).toBeInTheDocument()
        expect(screen.getByText('Anunciar você mesmo')).toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
        expect(mockRouter.back).not.toHaveBeenCalled()
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

    it('não redireciona broker pendente/incompleto fora do fluxo de anúncio', async () => {
        mockUserContextValue = {
            session: mockBrokerPendingSession,
        }

        render(<AnunciePage />)

        expect(
            await screen.findByRole('heading', { name: 'Como você quer anunciar?' }),
        ).toBeInTheDocument()
        expect(mockRouter.replace).not.toHaveBeenCalledWith('/onboarding')
        expect(mockRouter.replace).not.toHaveBeenCalledWith('/onboarding/broker')
    })

    it('permite broker pendente com pending_documents seguir como proprietário', async () => {
        mockUserContextValue = {
            session: mockBrokerPendingDocumentsSession,
        }
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        expect(await screen.findByText('Cadastrar imóvel')).toBeInTheDocument()
        expect(screen.getByText('Fluxo de cliente-proprietário')).toBeInTheDocument()
        expect(mockRouter.push).not.toHaveBeenCalledWith('/onboarding/broker')
        expect(mockRouter.replace).not.toHaveBeenCalledWith('/onboarding/broker')
    })

    it('direciona corretor aprovado direto para o cadastro do imóvel', async () => {
        mockUserContextValue = {
            session: mockBrokerApprovedSession,
        }
        render(<AnunciePage />)

        expect(await screen.findByText('Cadastrar imóvel')).toBeInTheDocument()
        expect(screen.getByText('Fluxo de corretor aprovado')).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Como você quer anunciar?' })).not.toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
    })

    it('bloqueia visitante e redireciona para login', () => {
        mockUserContextValue = {
            session: null,
        }

        render(<AnunciePage />)

        expect(mockRouter.replace).toHaveBeenCalledWith('/auth/login?next=/anuncie')
        expect(screen.queryByRole('heading', { name: 'Como você quer anunciar?' })).not.toBeInTheDocument()
    })

    it('mostra aviso em modal quando seleciona "Não, quero anunciar de outra pessoa"', async () => {
        mockUserContextValue = {
            session: mockBrokerPendingSession,
        }
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Não, quero anunciar de outra pessoa'))

        expect(await screen.findByText('Não é possível anunciar imóvel de outra pessoa pelo site/app.')).toBeInTheDocument()
        expect(screen.getByText('Use esta tela para voltar e escolher outra opção.')).toBeInTheDocument()
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('permite fechar o modal de aviso e manter a tela principal', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Não, quero anunciar de outra pessoa'))

        fireEvent.click(await screen.findByRole('button', { name: 'Entendi' }))
        expect(screen.getByText('Você é proprietário do imóvel?')).toBeInTheDocument()
        expect(screen.getByText('Sim, sou proprietário')).toBeInTheDocument()
        expect(screen.queryByText('Não é possível anunciar imóvel de outra pessoa pelo site/app.')).not.toBeInTheDocument()
    })

    it('abre modal de contato e dispara notificação para admins', async () => {
        render(<AnunciePage />)

        const contact = await screen.findByText('Entrar em contato com a equipe')
        fireEvent.click(contact)
        expect(await screen.findByText('Fale com nossos especialistas')).toBeInTheDocument()
        const notifyButton = await screen.findByRole('button', { name: 'Notificar administradores' })
        fireEvent.click(notifyButton)

        const { requestSupportContact } = await import('@/lib/api/user')
        await waitFor(() => {
            expect(requestSupportContact).toHaveBeenCalledWith({ source: 'anuncie', channel: 'web' })
        })
        expect(window.open).not.toHaveBeenCalled()
        expect(await screen.findByText('Sua solicitação foi enviada para os administradores.')).toBeInTheDocument()
    })

    it('garante que as perguntas de escolha não reaparecem após abrir formulário', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        await waitFor(() => {
            expect(screen.getByText('Cadastrar imóvel')).toBeInTheDocument()
        })
        expect(screen.queryByRole('heading', { name: 'Como você quer anunciar?' })).not.toBeInTheDocument()
        expect(screen.queryByText('Você é proprietário do imóvel?')).not.toBeInTheDocument()
    })

    it('permite sair da criação de imóveis pelo botão superior', async () => {
        render(<AnunciePage />)

        fireEvent.click(await screen.findByText('Anunciar você mesmo'))
        fireEvent.click(await screen.findByText('Sim, sou proprietário'))

        fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))

        expect(mockRouter.replace).toHaveBeenCalledWith('/meus-imoveis')
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
