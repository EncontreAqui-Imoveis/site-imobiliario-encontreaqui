import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import LoginPage from '@/app/auth/login/page'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn().mockResolvedValue(undefined)
const mockSearchParamsGet = jest.fn()
const mockLoginWithEmailHybrid = jest.fn()
const mockLoginWithGooglePopup = jest.fn()

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
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    useSearchParams: () => ({
        get: mockSearchParamsGet,
    }),
}))

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: null,
        loading: false,
        refresh: mockRefresh,
        isProfileComplete: false,
    }),
}))

jest.mock('@/lib/auth/hybridEmailLogin', () => ({
    loginWithEmailHybrid: (...args: unknown[]) => mockLoginWithEmailHybrid(...args),
}))

jest.mock('@/lib/auth/googleFlow', () => ({
    loginWithGooglePopup: (...args: unknown[]) => mockLoginWithGooglePopup(...args),
}))

jest.mock('@/lib/api/auth', () => ({
    isGooglePendingAuthResult: () => false,
    loginWithGoogle: () => Promise.resolve({}),
}))

describe('login page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParamsGet.mockReturnValue(null)
    })

    it('não exibe erro quando o usuário fecha o popup do Google', async () => {
        mockLoginWithGooglePopup.mockRejectedValueOnce({
            code: 'auth/popup-closed-by-user',
            message: 'Firebase: Error (auth/popup-closed-by-user)',
        })

        render(<LoginPage />)

        fireEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }))

        await waitFor(() => {
            expect(mockLoginWithGooglePopup).toHaveBeenCalledTimes(1)
        })

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('aplica espaçamento de topo para evitar sobreposição com navbar', () => {
        const { container } = render(<LoginPage />)
        const shell = container.firstElementChild

        expect(shell).toHaveClass('min-h-[calc(100vh-4rem)]')
        expect(shell).toHaveClass('pt-28')
        expect(shell).toHaveClass('sm:pt-36')
    })
})
