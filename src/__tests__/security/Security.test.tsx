import { render, screen, waitFor } from '@testing-library/react'
import EditProfileForm from '@/app/perfil/editar/EditProfileForm'
import { useAuth } from '@/contexts/AuthContext'

// Mock dependencies
// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: mockPush,
        back: jest.fn(),
    })),
}))

jest.mock('lucide-react', () => ({
    Phone: () => null,
    MapPin: () => null,
    Building2: () => null,
    Save: () => null,
    ArrowLeft: () => null,
    Loader2: () => null,
}))

// Mock useAuth to avoid AuthProvider issues
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('Security Tests', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        const useRouter = require('next/navigation').useRouter
        useRouter.mockImplementation(() => ({
            push: mockPush,
            back: jest.fn()
        }))
    })

    it('redirects unauthenticated user from protected route', async () => {
        // Mock unauthenticated
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        })

        render(<EditProfileForm />)

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login?redirect=/perfil/editar')
        })
    })

    it('renders for authenticated user', async () => {
        // Mock authenticated
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, name: 'User', phone: '+5511999999999' },
            isAuthenticated: true,
            isLoading: false,
        })

        render(<EditProfileForm />)
        expect(await screen.findByDisplayValue('User')).toBeInTheDocument()
    })

    it('sanitizes user input (XSS check by React default)', async () => {
        // Mock user with malicious input
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, name: '<script>alert("xss")</script>', email: 'test@example.com', phone: '+5511999999999' },
            isAuthenticated: true,
            isLoading: false,
        })

        render(<EditProfileForm />)

        await waitFor(() => {
            expect(screen.getByDisplayValue('<script>alert("xss")</script>')).toBeInTheDocument()
        })
    })
})
