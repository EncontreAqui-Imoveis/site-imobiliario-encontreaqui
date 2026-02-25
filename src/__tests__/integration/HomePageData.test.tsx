import { render, screen } from '@testing-library/react'
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

const createProperty = (id: number): Property => ({
    id,
    title: `Imóvel ${id}`,
    description: 'Descricao',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda',
    price: 100000,
    address: 'Rua',
    city: 'Rio Verde',
    state: 'GO',
    images: ['https://cdn/imovel.jpg'],
    createdAt: '2026-02-01T00:00:00.000Z',
})

describe('HomePage real data integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('loads featured and recent properties from API layer', async () => {
        ;(fetchFeaturedProperties as jest.Mock).mockResolvedValue([createProperty(1), createProperty(2)])
        ;(fetchRecentProperties as jest.Mock).mockResolvedValue([createProperty(3)])

        const page = await HomePage()
        render(page)

        expect(fetchFeaturedProperties).toHaveBeenCalledWith(6)
        expect(fetchRecentProperties).toHaveBeenCalledWith(8)
        expect(screen.getByTestId('featured-carousel')).toHaveTextContent('Featured: 2')
        expect(screen.getByTestId('recent-properties')).toHaveTextContent('Recent: 1')
        expect(screen.getByTestId('hero-section')).toBeInTheDocument()
        expect(screen.getByTestId('about-section')).toBeInTheDocument()
    })
})
