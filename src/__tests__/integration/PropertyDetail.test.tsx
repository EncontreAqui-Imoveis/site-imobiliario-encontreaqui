import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PropertyDetailClient from '@/components/property/PropertyDetailClient'
import { Property } from '@/types/property'

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('next/link', () => {
    function MockNextLink({ children, href }: { children: ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('next/image', () => ({
    __esModule: true,
    default: function MockNextImage({
        fill,
        ...props
    }: ComponentPropsWithoutRef<'img'> & { fill?: boolean }) {
        return React.createElement('img', {
            ...props,
            alt: props.alt ?? '',
            'data-fill': fill ? 'true' : undefined,
        })
    },
}))

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
            Comp.displayName = prop
            return Comp
        },
    })
})

jest.mock('@/components/property/PropertyCard', () => {
    return function MockPropertyCard({ property }: { property: Property }) {
        return <div data-testid="property-card">{property.title}</div>
    }
})

// Mock components to avoid deep rendering complexity
jest.mock('@/components/property/PropertyGallery', () => {
    return function MockGallery({ title }: { title: string }) {
        return <div data-testid="property-gallery">{title}</div>
    }
})

jest.mock('@/components/property/PropertyInfo', () => {
    return function MockInfo({ property }: { property: Property }) {
        return <div data-testid="property-info">{property.description}</div>
    }
})

jest.mock('@/components/property/PropertySidebar', () => {
    return function MockSidebar() {
        return <div data-testid="property-sidebar">Sidebar</div>
    }
})

jest.mock('@/components/property/CloseDealDialog', () => {
    return function MockCloseDealDialog() {
        return null
    }
})

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: null,
        loading: false,
        isBroker: false,
        isAuthenticated: false,
    }),
}))

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
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        })
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({}),
        })
        window.fetch = global.fetch
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders property details', () => {
        render(<PropertyDetailClient initialProperty={mockProperty} />)

        expect(
            screen.getByRole('main', { name: /detalhes do imóvel luxury villa/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('navigation', { name: /breadcrumb/i })
        ).toBeInTheDocument()
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

    })
})
