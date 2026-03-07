import React from 'react'
import { render, screen } from '@testing-library/react'

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

jest.mock('@/lib/appLinks', () => ({
    getStoreUrlClient: () => 'https://play.google.com/store/apps/details?id=com.encontreaqui.imoveis.app',
}))

import VerificarEmailPage from '@/app/auth/verificar-email/page'

describe('VerificarEmailPage legado', () => {
    beforeEach(() => {
        mockUseSearchParams.mockReturnValue({
            get: (key: string) => {
                const params: Record<string, string> = {
                    mode: 'verifyEmail',
                    oobCode: 'legacy-code',
                }
                return params[key] ?? null
            },
        })
    })

    it('shows legacy guidance and points user to code entry', async () => {
        render(<VerificarEmailPage />)

        expect(screen.getByText('Link legado de verificacao')).toBeInTheDocument()
        expect(
            screen.getByText(
                'Agora a confirmacao de email e feita por codigo numerico. Volte ao app ou ao site e informe o codigo enviado para o seu email.',
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Informar codigo' }),
        ).toHaveAttribute('href', '/verificacao')
    })
})
