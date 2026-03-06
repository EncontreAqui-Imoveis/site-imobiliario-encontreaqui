import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockApplyActionCode = jest.fn()
const mockCheckActionCode = jest.fn()
const mockUseSearchParams = jest.fn()

jest.mock('next/navigation', () => ({
    useSearchParams: () => mockUseSearchParams(),
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

jest.mock('firebase/auth', () => ({
    applyActionCode: (...args: unknown[]) => mockApplyActionCode(...args),
    checkActionCode: (...args: unknown[]) => mockCheckActionCode(...args),
}))

jest.mock('@/lib/firebase', () => ({
    auth: {},
}))

jest.mock('@/lib/appLinks', () => ({
    getStoreUrlClient: () => 'https://play.google.com/store/apps/details?id=com.encontreaqui.imoveis.app',
}))

import VerificarEmailPage from '@/app/auth/verificar-email/page'

describe('VerificarEmailPage', () => {
    beforeEach(() => {
        mockApplyActionCode.mockReset()
        mockCheckActionCode.mockReset()
        mockUseSearchParams.mockReturnValue({
            get: (key: string) => {
                const params: Record<string, string> = {
                    mode: 'verifyEmail',
                    oobCode: 'code-123',
                    continueUrl: '/auth/login',
                }
                return params[key] ?? null
            },
        })
    })

    it('prevalidates on load and only applies on explicit click', async () => {
        mockCheckActionCode.mockResolvedValue({
            data: { email: 'teste@example.com' },
        })
        mockApplyActionCode.mockResolvedValue(undefined)

        render(<VerificarEmailPage />)

        await waitFor(() => {
            expect(screen.getByText('Confirmar email')).toBeInTheDocument()
        })
        expect(mockApplyActionCode).not.toHaveBeenCalled()
        expect(
            screen.getByText(
                'Link pronto para confirmacao. So confirme se foi voce quem solicitou.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clique aqui para confirmar seu e-mail',
            }),
        )

        await waitFor(() => {
            expect(screen.getByText('Email verificado')).toBeInTheDocument()
        })
        expect(mockApplyActionCode).toHaveBeenCalledTimes(1)
        expect(
            screen.getByText(
                'E-mail verificado com sucesso! Você já pode fechar esta aba e retornar ao aplicativo no seu celular.',
            ),
        ).toBeInTheDocument()
    })

    it('shows an informative error for expired or used links', async () => {
        mockCheckActionCode.mockRejectedValue(new Error('expired-action-code'))

        render(<VerificarEmailPage />)

        expect(
            await screen.findByText(
                'Esse link expirou ou ja foi usado. Solicite um novo email de verificacao.',
            ),
        ).toBeInTheDocument()
    })
})
