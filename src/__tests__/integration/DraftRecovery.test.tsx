import { render, screen, waitFor } from '@testing-library/react'
import RegisterPage from '@/app/cadastro/page'
import { RegistrationProvider } from '@/contexts/RegistrationContext'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
}))

jest.mock('lucide-react', () => ({
    Mail: () => null,
    Lock: () => null,
    Eye: () => null,
    EyeOff: () => null,
    User: () => null,
    Phone: () => null,
    ArrowRight: () => null,
    ArrowLeft: () => null,
    MapPin: () => null,
    BadgeCheck: () => null,
    UserCircle: () => null,
}))

// Mock API
jest.mock('@/lib/api', () => ({
    authApi: {
        checkEmailStatus: jest.fn(),
        register: jest.fn(),
        login: jest.fn(),
    },
    favoritesApi: {
        getAll: jest.fn().mockResolvedValue({ data: [] }),
    },
    notificationsApi: {
        getAll: jest.fn().mockResolvedValue({ data: [] }),
    },
}))

// Mock useAuth to avoid AuthProvider issues
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(() => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    })),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('Draft Recovery Integration', () => {
    const mockDraft = {
        step: 'form',
        userType: 'client',
        authData: {
            name: 'Draft User',
            email: 'draft@example.com',
            phone: '(11) 98888-8888',
            password: '',
            creci: '',
            street: '',
            number: '',
            complement: '',
            bairro: '',
            city: '',
            state: '',
            cep: ''
        },
        updatedAt: new Date().toISOString()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    it('hydrates form from localStorage draft', async () => {
        // Setup draft in localStorage
        localStorage.setItem('registration_draft', JSON.stringify(mockDraft))

        render(
            <RegistrationProvider>
                <RegisterPage />
            </RegistrationProvider>
        )

        // Wait for hydration
        await waitFor(() => {
            expect(screen.getByDisplayValue('Draft User')).toBeInTheDocument()
            expect(screen.getByDisplayValue('draft@example.com')).toBeInTheDocument()
            // Phone might be formatted
            expect(screen.getByDisplayValue('(11) 98888-8888')).toBeInTheDocument()
        })
    })

    it('starts empty if no draft exists', async () => {
        render(
            <RegistrationProvider>
                <RegisterPage />
            </RegistrationProvider>
        )

        await waitFor(() => {
            // Check for empty inputs or initial state
            // RegisterPage likely has empty inputs initially
            const nameInput = screen.getByPlaceholderText(/Seu nome/i) as HTMLInputElement
            expect(nameInput.value).toBe('')
        })
    })
})
