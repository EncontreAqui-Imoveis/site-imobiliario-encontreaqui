import React from 'react'
import { render, screen } from '@testing-library/react'

import ConfiguracoesPage from '@/app/configuracoes/page'

const mockUseUser = jest.fn()

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

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => mockUseUser(),
}))

describe('settings page theme access', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseUser.mockReturnValue({
            session: null,
            loading: false,
        })
    })

    it('renders settings page for guests without theme switch', async () => {
        render(<ConfiguracoesPage />)

        expect(await screen.findByText('Configurações')).toBeInTheDocument()
        expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    })

    it('shows guest access guidance', async () => {
        render(<ConfiguracoesPage />)

        expect(await screen.findByText('Entre para acessar configuracoes da conta')).toBeInTheDocument()
    })
})
