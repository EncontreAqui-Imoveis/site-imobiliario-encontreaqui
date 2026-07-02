import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import LoginPage from '@/app/auth/login/page'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn().mockResolvedValue(undefined)
const mockSearchParamsGet = jest.fn()
const mockLoginWithEmailHybrid = jest.fn()
const mockLoginWithGooglePopup = jest.fn()
const mockCheckEmail = jest.fn()
const mockRequestPasswordReset = jest.fn()
const mockVerifyPasswordResetCode = jest.fn()
const mockConfirmPasswordReset = jest.fn()

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
    checkEmail: (...args: unknown[]) => mockCheckEmail(...args),
    requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
    verifyPasswordResetCode: (...args: unknown[]) => mockVerifyPasswordResetCode(...args),
    confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
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

    it('mostra mensagem de divergência de perfil quando backend informa cliente versus corretor', async () => {
        mockLoginWithEmailHybrid.mockRejectedValueOnce({
            status: 401,
            message: 'Credenciais inválidas.',
            payload: {
                requestedProfile: 'client',
                accountRole: 'broker',
            },
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText('E-mail'), {
            target: { value: 'client-user@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha'), {
            target: { value: '123456' },
        })

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Esta conta é de corretor. Selecione Corretor para entrar.')
        })
    })

    it('mostra mensagem de divergência de perfil no sentido inverso', async () => {
        mockLoginWithEmailHybrid.mockRejectedValueOnce({
            status: 401,
            message: 'Credenciais inválidas.',
            payload: {
                requestedProfile: 'broker',
                role: 'client',
            },
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText('E-mail'), {
            target: { value: 'broker-user@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha'), {
            target: { value: '123456' },
        })

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Esta conta é de cliente. Selecione Cliente para entrar.')
        })
    })

    it('mantém erro genérico quando backend não informa informação de perfil no 401', async () => {
        mockLoginWithEmailHybrid.mockRejectedValueOnce({
            status: 401,
            message: 'Credenciais inválidas.',
            payload: {
                message: 'Credenciais inválidas.',
            },
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText('E-mail'), {
            target: { value: 'unknown@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha'), {
            target: { value: '123456' },
        })

        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Credenciais inválidas. Verifique seu e-mail e senha.')
        })
    })

    it('aplica espaçamento de topo para evitar sobreposição com navbar', () => {
        const { container } = render(<LoginPage />)
        const shell = container.firstElementChild

        expect(shell).toHaveClass('flex')
        expect(shell).toHaveClass('w-full')
        expect(shell).toHaveClass('overflow-hidden')
    })

    it('gerencia o fluxo completo de recuperar senha dentro do modal de forma inline', async () => {
        mockCheckEmail.mockResolvedValueOnce({ exists: true, hasFirebaseUid: false, hasPassword: true })
        mockRequestPasswordReset.mockResolvedValueOnce(undefined)
        mockVerifyPasswordResetCode.mockResolvedValueOnce({ reset_session_token: 'mock-session-token' })
        mockConfirmPasswordReset.mockResolvedValueOnce(undefined)

        const { container } = render(<LoginPage />)

        // Clica no botão para abrir o modal
        fireEvent.click(screen.getByRole('button', { name: 'Esqueci a senha?' }))

        // ETAPA 1: Solicitar código
        const modalEmailInput = container.querySelector('#modal-email') as HTMLInputElement
        fireEvent.change(modalEmailInput, {
            target: { value: 'recovery@example.com' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar Código' }))

        await waitFor(() => {
            expect(mockCheckEmail).toHaveBeenCalledWith('recovery@example.com')
            expect(mockRequestPasswordReset).toHaveBeenCalledWith('recovery@example.com')
            expect(screen.getByText('Confirmar código')).toBeInTheDocument()
        })

        // ETAPA 2: Inserir código de verificação
        const inputs = container.querySelectorAll('input[type="text"]')
        expect(inputs.length).toBe(6)
        fireEvent.change(inputs[0], { target: { value: '1' } })
        fireEvent.change(inputs[1], { target: { value: '2' } })
        fireEvent.change(inputs[2], { target: { value: '3' } })
        fireEvent.change(inputs[3], { target: { value: '4' } })
        fireEvent.change(inputs[4], { target: { value: '5' } })
        fireEvent.change(inputs[5], { target: { value: '6' } })

        fireEvent.click(screen.getByRole('button', { name: 'Validar Código' }))

        await waitFor(() => {
            expect(mockVerifyPasswordResetCode).toHaveBeenCalledWith('recovery@example.com', '123456')
            expect(screen.getByText('Definir nova senha')).toBeInTheDocument()
        })

        // ETAPA 3: Inserir nova senha
        const newPasswordInput = container.querySelector('#new-password') as HTMLInputElement
        const confirmPasswordInput = container.querySelector('#confirm-password') as HTMLInputElement

        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

        fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

        await waitFor(() => {
            expect(mockConfirmPasswordReset).toHaveBeenCalledWith('recovery@example.com', 'mock-session-token', 'newpassword123')
            expect(screen.getByText('Senha redefinida!')).toBeInTheDocument()
        })

        // ETAPA 4: Concluir e fechar
        fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

        // O modal deve ser desmontado e não estar mais no documento
        expect(container.querySelector('.bg-black\\/60')).not.toBeInTheDocument()
    })
})
