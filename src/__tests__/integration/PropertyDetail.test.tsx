import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PropertyDetailClient from '@/components/property/PropertyDetailClient'
import { Property } from '@/types/property'
import { useAuth } from '@/contexts/AuthContext'

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>
    }
})

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}))

jest.mock('lucide-react', () => ({
    Home: () => <div data-testid="icon-home" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />,
    MapPin: () => <div data-testid="icon-map-pin" />,
    Bed: () => <div data-testid="icon-bed" />,
    Bath: () => <div data-testid="icon-bath" />,
    Car: () => <div data-testid="icon-car" />,
    Maximize: () => <div data-testid="icon-maximize" />,
    Waves: () => <div data-testid="icon-waves" />,
    Building2: () => <div data-testid="icon-building" />,
    Phone: () => <div data-testid="icon-phone" />,
    Share2: () => <div data-testid="icon-share" />,
    Heart: () => <div data-testid="icon-heart" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Hash: () => <div data-testid="icon-hash" />,
    Map: () => <div data-testid="icon-map" />,
    MessageCircle: () => <div data-testid="icon-message" />,
    ArrowRight: () => <div data-testid="icon-arrow-right" />,
    XCircle: () => <div data-testid="icon-x-circle" />,
}))

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}))

jest.mock('@/components/property/PropertyCard', () => {
    return function MockPropertyCard({ property }: any) {
        return <div data-testid="property-card">{property.title}</div>
    }
})

// Mock components to avoid deep rendering complexity
jest.mock('@/components/property/PropertyGallery', () => {
    return function MockGallery({ title }: any) {
        return <div data-testid="property-gallery">{title}</div>
    }
})

jest.mock('@/components/property/PropertyInfo', () => {
    return function MockInfo({ property }: any) {
        return <div data-testid="property-info">{property.description}</div>
    }
})

jest.mock('@/components/property/PropertySidebar', () => {
    return function MockSidebar() {
        return <div data-testid="property-sidebar">Sidebar</div>
    }
})

const mockProperty: Property = {
    id: 1,
    title: 'Luxury Villa',
    description: 'Beautiful villa with pool',
    price: 2500000,
    priceSale: 2500000,
    bairro: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    bedrooms: 4,
    bathrooms: 5,
    garageSpots: 3,
    areaConstruida: 450,
    images: ['/img1.jpg'],
    purpose: 'Venda',
    type: 'Casa',
    status: 'approved',
    brokerId: 101,
    createdAt: new Date().toISOString(),

    brokerPhone: '11999998888',
    hasWifi: true,
    temPiscina: true,
    address: 'Rua das Flores, 123'
}

describe('PropertyDetailClient', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
        })
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        })
        global.fetch = jest.fn()
        window.fetch = global.fetch
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders property details', () => {
        render(<PropertyDetailClient initialProperty={mockProperty} />)

        expect(screen.getAllByText('Luxury Villa')[0]).toBeInTheDocument()
        expect(screen.getByTestId('property-gallery')).toBeInTheDocument()
        expect(screen.getByTestId('property-info')).toBeInTheDocument()
        expect(screen.getByTestId('property-sidebar')).toBeInTheDocument()

        // Breadcrumb
        expect(screen.getByText('Imóveis')).toBeInTheDocument()
    })

    it('fetches and renders similar properties', async () => {
        const mockSimilar = {
            data: [
                { ...mockProperty, id: 2, title: 'Similar House 1' },
                { ...mockProperty, id: 3, title: 'Similar House 2' }
            ]
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockSimilar,
            })

        render(<PropertyDetailClient initialProperty={mockProperty} />)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.any(String))
        })

        // Check if similar properties were rendered
        await waitFor(() => {
            expect(screen.getByText('Similar House 1')).toBeInTheDocument()
        })

        // Similar properties section should appear
        // Note: Similar properties are rendered using PropertyCard. 
        // We aren't mocking PropertyCard here so it might render fully or we should mock it.
        // If we don't mock it, it will try to access contexts. PropertyCard uses useAuth and useRouter.
        // We mocked those, so it should be fine.
    })
})
