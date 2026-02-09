
// Mock console.error to avoid jsdom errors in output
const originalConsoleError = console.error
beforeAll(() => {
    console.error = (...args) => {
        if (/Warning.*not wrapped in act/.test(args[0])) {
            return
        }
        originalConsoleError(...args)
    }
})

import { render, screen, fireEvent } from '@testing-library/react'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>
    }
})

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}))

// Mock lucide icons to avoid rendering issues
jest.mock('lucide-react', () => ({
    Heart: () => <div data-testid="heart-icon" />,
    Bed: () => <div data-testid="bed-icon" />,
    Bath: () => <div data-testid="bath-icon" />,
    Car: () => <div data-testid="car-icon" />,
    Maximize: () => <div data-testid="maximize-icon" />,
    MapPin: () => <div data-testid="map-pin-icon" />,
    ChevronLeft: () => <div data-testid="chevron-left" />,
    ChevronRight: () => <div data-testid="chevron-right" />,
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}))

const mockProperty: Property = {
    id: 1,
    title: 'Test Property',
    description: 'Description',
    price: 1000000,
    priceSale: 1000000,
    priceRent: undefined,
    bairro: 'Test Neighborhood',
    city: 'Test City',
    state: 'SP',
    bedrooms: 3,
    bathrooms: 2,
    garageSpots: 1,
    areaConstruida: 100,
    address: 'Test Address',
    images: ['/img1.jpg', '/img2.jpg'],
    purpose: 'Venda',
    type: 'Casa',
    status: 'approved',
    brokerId: 1, // Corrected to number
    createdAt: new Date().toISOString(),
    hasWifi: true,
    temPiscina: false,
}

describe('PropertyCard', () => {
    const mockRouter = { push: jest.fn() }
    const mockToggleFavorite = jest.fn()

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter)
            ; (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                isFavorite: jest.fn().mockReturnValue(false),
                toggleFavorite: mockToggleFavorite,
            })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders property details correctly', () => {
        render(<PropertyCard property={mockProperty} />)

        expect(screen.getByText('Test Property')).toBeInTheDocument()
        expect(screen.getByText(/Test Neighborhood/)).toBeInTheDocument() // Loose match
        expect(screen.getAllByText('3')[0]).toBeInTheDocument() // Using getAllByText just in case
        expect(screen.getByText(/R\$\s1\.000\.000/)).toBeInTheDocument()
        expect(screen.getAllByText('Venda')[0]).toBeInTheDocument()
    })

    it('renders "Aluguel" badge correctly', () => {
        const rentProperty: Property = { ...mockProperty, purpose: 'Aluguel', priceSale: undefined, priceRent: 2000 }
        render(<PropertyCard property={rentProperty} />)
        expect(screen.getAllByText('Aluguel')[0]).toBeInTheDocument()
    })

    it('toggles favorite status when authorized', () => {
        render(<PropertyCard property={mockProperty} />)

        const favButton = screen.getByLabelText('Adicionar aos favoritos')
        fireEvent.click(favButton)

        expect(mockToggleFavorite).toHaveBeenCalledWith(1)
    })

    it('redirects to login when clicking favorite if unauthorized', () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            isFavorite: jest.fn().mockReturnValue(false),
            toggleFavorite: mockToggleFavorite,
        })

        render(<PropertyCard property={mockProperty} />)

        const favButton = screen.getByLabelText('Adicionar aos favoritos')
        fireEvent.click(favButton)

        expect(mockToggleFavorite).not.toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=/imoveis/1')
    })

    it('navigates through images', () => {
        render(<PropertyCard property={mockProperty} />)

        const nextButton = screen.getByLabelText('Próxima imagem')
        const img = screen.getByAltText('Test Property')

        expect(img).toHaveAttribute('src', '/img1.jpg')

        fireEvent.click(nextButton)
        expect(img).toHaveAttribute('src', '/img2.jpg')

        fireEvent.click(nextButton)
        expect(img).toHaveAttribute('src', '/img1.jpg') // Loop back
    })
})
