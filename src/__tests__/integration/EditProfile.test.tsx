import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditProfileForm from '@/app/perfil/editar/EditProfileForm'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('lucide-react', () => ({
    Phone: () => null,
    MapPin: () => null,
    Building2: () => null,
    Save: () => null,
    ArrowLeft: () => null,
    Loader2: () => null,
}))

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}))

describe('EditProfileForm Incremental', () => {
    beforeEach(() => {
        const mockRouter = { back: jest.fn(), push: jest.fn() }
            ; (useRouter as jest.Mock).mockReturnValue(mockRouter)

            ; (useAuth as jest.Mock).mockReturnValue({
                user: { id: 1, name: 'Test' },
                isAuthenticated: true,
                isLoading: false,
                updateProfile: jest.fn(),
            })
    })

    it('renders without crashing', () => {
        render(<EditProfileForm />)
        expect(screen.getByText('Completar Cadastro')).toBeInTheDocument()
    })

    it('loads user data into form fields', async () => {
        render(<EditProfileForm />)
        expect(await screen.findByDisplayValue('Test')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
        render(<EditProfileForm />)
        // Phone input
        const phoneInput = screen.getByPlaceholderText('(00) 00000-0000')
        fireEvent.change(phoneInput, { target: { value: '' } })

        fireEvent.click(screen.getByText('Salvar Alterações'))

        expect(await screen.findByText(/Telefone válido é obrigatório/i)).toBeInTheDocument()
    })

    it('submits form with updated data', async () => {
        const updateProfileMock = jest.fn().mockResolvedValue({ success: true })
            ; (useAuth as jest.Mock).mockReturnValue({
                user: {
                    id: 1,
                    name: 'Test',
                    phone: '+5511999999999',
                    street: 'Test Street',
                    number: '123',
                    bairro: 'Test Bairro',
                    city: 'Old City',
                    state: 'SP',
                    cep: '12345-678',
                    complement: ''
                },
                isAuthenticated: true,
                isLoading: false,
                updateProfile: updateProfileMock,
            })

        render(<EditProfileForm />)

        // Wait for data load
        await screen.findByDisplayValue('Test')

        // Change city
        fireEvent.change(screen.getByLabelText(/Cidade/i), { target: { value: 'New City' } })

        fireEvent.click(screen.getByText('Salvar Alterações'))

        await waitFor(() => {
            expect(updateProfileMock).toHaveBeenCalledWith(expect.objectContaining({
                city: 'New City'
            }))
        })
    })
})
