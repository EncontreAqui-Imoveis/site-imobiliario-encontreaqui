import React from 'react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { render, screen } from '@testing-library/react'

import LoginPage from '@/app/auth/login/page'
import CadastroPage from '@/app/auth/cadastro/page'
import VerificacaoPage from '@/app/verificacao/page'

expect.extend(toHaveNoViolations)

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
                phone: '(64)99999-9999',
            },
            profileStatus: 'incomplete',
        },
        loading: false,
        refresh: jest.fn(),
        isProfileComplete: false,
    }),
}))

jest.mock('@/lib/api/auth', () => ({
    login: jest.fn(),
    register: jest.fn(),
    sendEmailVerificationCode: jest.fn(),
    verifyEmailCode: jest.fn(),
}))

jest.mock('@/lib/auth/googleFlow', () => ({
    loginWithGooglePopup: jest.fn(),
}))

describe('auth and verification accessibility', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        }) as jest.Mock
        window.fetch = global.fetch
    })

    it('renders login with accessible labels and no basic axe violations', async () => {
        const { container } = render(<LoginPage />)

        expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
        expect(screen.getByLabelText('Senha')).toBeInTheDocument()

        const results = await axe(container, {
            rules: {
                'color-contrast': { enabled: false },
            },
        })

        expect(results).toHaveNoViolations()
    })

    it('renders cadastro and verification with explicit instructions', async () => {
        const cadastro = render(<CadastroPage />)
        expect(screen.getByText('Endereço')).toBeInTheDocument()
        expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument()
        cadastro.unmount()

        const verificacao = render(<VerificacaoPage />)
        expect(screen.getByRole('button', { name: 'Enviar código de verificação' })).toBeInTheDocument()
        verificacao.unmount()
    })
})
