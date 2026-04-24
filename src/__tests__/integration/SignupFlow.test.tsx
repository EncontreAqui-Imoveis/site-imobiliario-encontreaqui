import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import CadastroPage from '@/app/auth/cadastro/page'
import VerificacaoPage from '@/app/verificacao/page'
import VerificarMetodoPage from '@/app/cadastro/verificar-metodo/page'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn().mockResolvedValue(undefined)
const mockSearchParamsGet = jest.fn()
const mockCheckEmail = jest.fn()
const mockCheckCreci = jest.fn()
const mockSendEmailVerificationCode = jest.fn()
const mockVerifyEmailCode = jest.fn()
const mockRegisterUserFromSignupDraft = jest.fn()
const mockResolvePostAuthRoute = jest.fn()
const mockLoadSignupDraft = jest.fn()
const mockMarkSignupDraftEmailVerified = jest.fn()
const mockSaveSignupDraft = jest.fn()
const mockRewindSignupDraftToAddress = jest.fn()

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

jest.mock('@/lib/api/auth', () => ({
    checkEmail: (...args: unknown[]) => mockCheckEmail(...args),
    checkCreci: (...args: unknown[]) => mockCheckCreci(...args),
    sendEmailVerificationCode: (...args: unknown[]) => mockSendEmailVerificationCode(...args),
    verifyEmailCode: (...args: unknown[]) => mockVerifyEmailCode(...args),
    isGooglePendingAuthResult: jest.fn(() => false),
}))

jest.mock('@/lib/registerFromSignupDraft', () => ({
    registerUserFromSignupDraft: (...args: unknown[]) => mockRegisterUserFromSignupDraft(...args),
}))

jest.mock('@/lib/auth/routeResolution', () => ({
    resolvePostAuthRoute: (...args: unknown[]) => mockResolvePostAuthRoute(...args),
}))

jest.mock('@/lib/authSignupDraft', () => ({
    createSignupDraft: jest.requireActual('@/lib/authSignupDraft').createSignupDraft,
    loadSignupDraft: () => mockLoadSignupDraft(),
    patchSignupDraft: jest.requireActual('@/lib/authSignupDraft').patchSignupDraft,
    clearSignupDraft: jest.requireActual('@/lib/authSignupDraft').clearSignupDraft,
    resolveSignupDraftHref: jest.requireActual('@/lib/authSignupDraft').resolveSignupDraftHref,
    saveSignupDraft: (...args: unknown[]) => mockSaveSignupDraft(...args),
    rewindSignupDraftToAddress: () => mockRewindSignupDraftToAddress(),
    markSignupDraftEmailVerified: (...args: unknown[]) => mockMarkSignupDraftEmailVerified(...args),
}))

jest.mock('@/lib/auth/googleFlow', () => ({
    loginWithGooglePopup: jest.fn(),
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

describe('signup flow', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParamsGet.mockReturnValue(null)
        mockCheckEmail.mockResolvedValue({ exists: false })
        mockCheckCreci.mockResolvedValue({ exists: false })
        mockResolvePostAuthRoute.mockReturnValue('/meus-imoveis')
        mockLoadSignupDraft.mockReturnValue(null)
        mockMarkSignupDraftEmailVerified.mockImplementation(() => ({
            source: 'email',
            userType: 'client',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'João',
                email: 'joao@example.com',
                password: '123456',
                phone: '62999998888',
                street: 'Rua A',
                number: '10',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        }))
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        }) as jest.Mock
        window.fetch = global.fetch
        window.localStorage.clear()
        window.sessionStorage.clear()
    })

    it('shows a clear selected state for profile cards', async () => {
        render(<CadastroPage />)

        const clientButton = screen.getByRole('button', { name: /quero cadastrar como cliente/i })
        const brokerButton = screen.getByRole('button', { name: /quero cadastrar como corretor/i })

        expect(clientButton).toHaveAttribute('aria-pressed', 'false')
        expect(brokerButton).toHaveAttribute('aria-pressed', 'false')

        fireEvent.click(clientButton)

        expect(clientButton).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText('Escolha aplicada. Continue para preencher seus dados.')).toBeInTheDocument()
        expect(screen.getByText('Selecionado')).toBeInTheDocument()
    })

    it('completes signup when email is already verified without redirecting to phone', async () => {
        mockSearchParamsGet.mockImplementation((key: string) => (key === 'flow' ? 'signup' : null))
        mockLoadSignupDraft.mockReturnValue({
            source: 'email',
            userType: 'client',
            step: 'email',
            emailVerified: false,
            phoneVerified: false,
            data: {
                name: 'João',
                email: 'joao@example.com',
                password: '123456',
                phone: '62999998888',
                street: 'Rua A',
                number: '10',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: '',
                googleIdToken: '',
                googleUid: '',
            },
            updatedAt: new Date().toISOString(),
        })
        mockSendEmailVerificationCode.mockResolvedValue({ delivery: 'already_verified' })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'client', email_verified: true, phone: '' },
            isBroker: false,
            profileStatus: 'complete',
            requiresBrokerDocuments: false,
        })

        render(<VerificacaoPage />)

        await waitFor(() => {
            expect(mockRegisterUserFromSignupDraft).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/meus-imoveis')
        })

        expect(mockPush).not.toHaveBeenCalledWith('/cadastro/verificar-telefone?flow=signup')
    })

    it('auto-completes from verify-method when email is already verified', async () => {
        mockLoadSignupDraft.mockReturnValue({
            source: 'google',
            userType: 'broker',
            step: 'verify_method',
            emailVerified: true,
            phoneVerified: false,
            data: {
                name: 'Maria',
                email: 'maria@example.com',
                password: '',
                phone: '62999998888',
                street: 'Rua B',
                number: '20',
                semNumero: false,
                complement: '',
                bairro: 'Centro',
                city: 'Rio Verde',
                state: 'GO',
                cep: '75900000',
                creci: 'GO123',
                googleIdToken: 'token',
                googleUid: 'uid',
            },
            updatedAt: new Date().toISOString(),
        })
        mockRegisterUserFromSignupDraft.mockResolvedValue({
            user: { role: 'broker', email_verified: true, phone: '' },
            isBroker: true,
            profileStatus: 'complete',
            requiresBrokerDocuments: true,
        })

        render(<VerificarMetodoPage />)

        await waitFor(() => {
            expect(mockRegisterUserFromSignupDraft).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/onboarding/broker?mode=signup')
        })

        expect(screen.getByText('Finalizando seu cadastro automaticamente...')).toBeInTheDocument()
    })
})
