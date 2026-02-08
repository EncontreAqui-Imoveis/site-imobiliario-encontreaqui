import { render, screen, waitFor } from '@testing-library/react'
import VerificarTelefonePage from '../verificar-telefone/page'
import { AuthProvider } from '@/contexts/AuthContext'
import { RegistrationProvider } from '@/contexts/RegistrationContext'

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
}))

// Mock Registration Context to provide draft data
const mockRegistrationContext = {
    draft: {
        authData: {
            name: 'Integration User',
            email: 'integration@example.com',
            phone: '+5511999999999'
        },
        userType: 'client'
    },
    updateStep: jest.fn(),
    clearDraft: jest.fn(),
}

jest.mock('@/contexts/RegistrationContext', () => ({
    ...jest.requireActual('@/contexts/RegistrationContext'),
    useRegistration: () => mockRegistrationContext,
    RegistrationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    setupRecaptcha: jest.fn(),
    sendPhoneSmsCode: jest.fn(),
    verifySmsCode: jest.fn(),
    clearRecaptcha: jest.fn(),
}))

describe('Registration Integration', () => {
    it('renders phone verification page with user data', async () => {
        // This is a simple smoke test since full integration requires complex mocking of Firebase/API
        render(
            <AuthProvider>
                <RegistrationProvider>
                    <VerificarTelefonePage />
                </RegistrationProvider>
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByText(/Verificar Telefone/i)).toBeInTheDocument()
            // Should verify that masking logic works
            expect(screen.getByText(/\+55 \(11\) \*\*\*\*\*-\d{4}/)).toBeInTheDocument()
        })
    })
})
