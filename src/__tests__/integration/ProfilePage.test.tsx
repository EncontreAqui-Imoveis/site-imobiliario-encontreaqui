/**
 * Integration test: Profile page
 * Tests rendering of all quick links including notification links
 */
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PerfilPage from '@/app/perfil/page'

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

jest.mock('next/link', () => {
    function MockLink({ children, href, ...rest }: { children: React.ReactNode; href: string;[key: string]: unknown }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockLink.displayName = 'MockLink'
    return MockLink
})

const mockLogout = jest.fn().mockResolvedValue(undefined)

const mockBrokerSession = {
    user: {
        id: 1,
        name: 'João Corretor',
        email: 'joao@corretor.com',
        phone: '62999998888',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apt 101',
        bairro: 'Setor Oeste',
        city: 'Goiânia',
        state: 'GO',
        cep: '74000-000',
    },
    isBroker: true,
    profileStatus: 'complete',
}

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: mockBrokerSession,
        loading: false,
        isBroker: true,
        logout: mockLogout,
    }),
}))

describe('Profile Page - Integration', () => {
    beforeEach(() => {
        mockPush.mockClear()
        mockReplace.mockClear()
        mockLogout.mockClear()
    })

    it('renders user info', () => {
        render(<PerfilPage />)

        expect(screen.getByText('João Corretor')).toBeInTheDocument()
        expect(screen.getByText('joao@corretor.com')).toBeInTheDocument()
        expect(screen.getByText('(62) 99999-8888')).toBeInTheDocument()
        expect(screen.getByText('Corretor')).toBeInTheDocument()
        expect(screen.getByText('Perfil completo')).toBeInTheDocument()
    })

    it('renders pending action card information', () => {
        render(<PerfilPage />)

        expect(screen.getByText('Verificar e-mail')).toBeInTheDocument()
        expect(screen.getByText('Continuar')).toBeInTheDocument()
    })

    it('renders all quick links for brokers', () => {
        render(<PerfilPage />)

        // Broker-specific links
        const meusImoveis = screen.getByText('Meus Imóveis').closest('a')
        expect(meusImoveis).toHaveAttribute('href', '/meus-imoveis')

        const relatorios = screen.getByText('Relatórios').closest('a')
        expect(relatorios).toHaveAttribute('href', '/relatorios')

        // General links
        const notificacoes = screen.getByText('Notificações').closest('a')
        expect(notificacoes).toHaveAttribute('href', '/notificacoes')

        const contratos = screen.getByText('Contratos').closest('a')
        expect(contratos).toHaveAttribute('href', '/contratos')
    })

    it('renders notification link with description', () => {
        render(<PerfilPage />)

        expect(screen.getByText('Propostas, contratos e novidades')).toBeInTheDocument()
    })

    it('does not render settings option anymore', () => {
        render(<PerfilPage />)

        expect(screen.queryByText('Configurações')).not.toBeInTheDocument()
        expect(screen.queryByText('Preferências e ajustes')).not.toBeInTheDocument()
    })

    it('handles logout', async () => {
        render(<PerfilPage />)

        const logoutBtn = screen.getByText('Sair').closest('button')!
        await act(async () => { fireEvent.click(logoutBtn) })

        expect(mockLogout).toHaveBeenCalledTimes(1)
        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('does not show "Quero ser corretor" for brokers', () => {
        render(<PerfilPage />)

        expect(screen.queryByText('Quero ser corretor')).not.toBeInTheDocument()
    })
})
