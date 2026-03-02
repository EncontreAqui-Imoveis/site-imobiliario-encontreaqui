import { render, screen, act } from '@testing-library/react'
import { Suspense } from 'react'
import HomePage from '@/app/page'
import { fetchFeaturedProperties, fetchRecentProperties } from '@/lib/propertiesApi'
import { Property } from '@/types/property'

jest.mock('@/lib/propertiesApi', () => ({
    fetchFeaturedProperties: jest.fn(),
    fetchRecentProperties: jest.fn(),
}))

jest.mock('@/components/home/HeroSection', () => {
    return function MockHeroSection() {
        return <div data-testid="hero-section">Hero</div>
    }
})

jest.mock('@/components/home/FeaturedCarousel', () => {
    return function MockFeaturedCarousel({ properties }: { properties: Property[] }) {
        return <div data-testid="featured-carousel">Featured: {properties.length}</div>
    }
})

jest.mock('@/components/home/RecentProperties', () => {
    return function MockRecentProperties({ properties }: { properties: Property[] }) {
        return <div data-testid="recent-properties">Recent: {properties.length}</div>
    }
})

jest.mock('@/components/home/AboutSection', () => {
    return function MockAboutSection() {
        return <div data-testid="about-section">About</div>
    }
})

jest.mock('@/components/property/PropertyCardSkeleton', () => {
    return function MockSkeleton() {
        return <div data-testid="skeleton">Loading...</div>
    }
})

const createProperty = (id: number): Property => ({
    id,
    title: `Imóvel ${id}`,
    description: 'Descricao',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda',
    price: 100000,
    address: 'Rua',
    city: 'Brasil',
    state: 'GO',
    images: ['https://cdn/imovel.jpg'],
    createdAt: '2026-02-01T00:00:00.000Z',
})

describe('HomePage integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders hero and about sections', () => {
        ; (fetchFeaturedProperties as jest.Mock).mockResolvedValue([])
            ; (fetchRecentProperties as jest.Mock).mockResolvedValue([])

        const page = HomePage()
        render(page)

        expect(screen.getByTestId('hero-section')).toBeInTheDocument()
        expect(screen.getByTestId('about-section')).toBeInTheDocument()
    })

    it('loads featured and recent properties via Suspense', async () => {
        ; (fetchFeaturedProperties as jest.Mock).mockResolvedValue([createProperty(1), createProperty(2)])
            ; (fetchRecentProperties as jest.Mock).mockResolvedValue([createProperty(3)])

        await act(async () => {
            render(HomePage())
        })

        // After Suspense resolves, data components render
        expect(fetchFeaturedProperties).toHaveBeenCalledWith(6)
        expect(fetchRecentProperties).toHaveBeenCalledWith(8)
    })

    it('shows skeleton fallbacks initially', () => {
        // Never-resolving promises to keep Suspense in loading state
        ; (fetchFeaturedProperties as jest.Mock).mockReturnValue(new Promise(() => { }))
            ; (fetchRecentProperties as jest.Mock).mockReturnValue(new Promise(() => { }))

        render(HomePage())

        // Skeletons should be visible
        const skeletons = screen.getAllByTestId('skeleton')
        expect(skeletons.length).toBeGreaterThanOrEqual(2)
    })

    it('renders empty state when API returns no data', async () => {
        ; (fetchFeaturedProperties as jest.Mock).mockResolvedValue([])
            ; (fetchRecentProperties as jest.Mock).mockResolvedValue([])

        await act(async () => {
            render(HomePage())
        })

        expect(screen.getByTestId('hero-section')).toBeInTheDocument()
        expect(screen.getByTestId('about-section')).toBeInTheDocument()
    })
})
