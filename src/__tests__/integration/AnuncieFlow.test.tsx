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

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: {
            user: {
                id: 10,
                name: 'Cliente Teste',
                role: 'client',
                email: 'cliente@test.com',
            },
        },
        loading: false,
    }),
}))

jest.mock('@/lib/negotiationsService')
jest.mock('@/lib/api/user', () => ({
    createProperty: jest.fn(),
}))

beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
    }) as jest.Mock
})

describe('Anuncie flow', () => {
    it('exibe o bloco de orientação para proprietário e avança para o formulário', async () => {
        render(<AnunciePage />)

        expect(await screen.findByText('Anunciar meu próprio imóvel')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Anunciar meu próprio imóvel'))

        expect(await screen.findByText('Anunciar como proprietário')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Entendi, continuar'))

        await waitFor(() => {
            expect(screen.getByText('Cadastrar imóvel')).toBeInTheDocument()
            expect(screen.getByText('Fluxo de cliente-proprietário')).toBeInTheDocument()
        })
    })
})
