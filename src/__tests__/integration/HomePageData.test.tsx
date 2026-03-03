import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import HomePage from '@/app/page'
import {
    FeaturedSection,
    FeaturedSkeleton,
    RecentSection,
    RecentSkeleton,
} from '@/components/home/HomeSections'
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
    return function MockSkeleton({ count = 1 }: { count?: number }) {
        return (
            <>
                {Array.from({ length: count }).map((_, index) => (
                    <div data-testid="skeleton" key={index}>
                        Loading...
                    </div>
                ))}
            </>
        )
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

    it('returns the expected static page structure without rendering async server components in jsdom', () => {
        const page = HomePage()

        expect(isValidElement(page)).toBe(true)

        const fragment = page as ReactElement<{ children: ReactNode }>
        const children = Children.toArray(fragment.props.children)

        expect(children).toHaveLength(4)
    })

    it('loads featured properties through the server section', async () => {
        ; (fetchFeaturedProperties as jest.Mock).mockResolvedValue([createProperty(1), createProperty(2)])

        render(await FeaturedSection())

        expect(fetchFeaturedProperties).toHaveBeenCalledWith(6)
        expect(screen.getByTestId('featured-carousel')).toHaveTextContent('Featured: 2')
    })

    it('loads recent properties through the server section', async () => {
        ; (fetchRecentProperties as jest.Mock).mockResolvedValue([createProperty(3)])

        render(await RecentSection())

        expect(fetchRecentProperties).toHaveBeenCalledWith(8)
        expect(screen.getByTestId('recent-properties')).toHaveTextContent('Recent: 1')
    })

    it('renders skeleton fallbacks without relying on suspense resolution in jsdom', () => {
        render(
            <>
                <FeaturedSkeleton />
                <RecentSkeleton />
            </>
        )

        const skeletons = screen.getAllByTestId('skeleton')
        expect(skeletons.length).toBe(11)
    })

    it('handles empty responses in both data sections', async () => {
        ; (fetchFeaturedProperties as jest.Mock).mockResolvedValue([])
        ; (fetchRecentProperties as jest.Mock).mockResolvedValue([])

        render(
            <>
                {await FeaturedSection()}
                {await RecentSection()}
            </>
        )

        expect(screen.getByTestId('featured-carousel')).toHaveTextContent('Featured: 0')
        expect(screen.getByTestId('recent-properties')).toHaveTextContent('Recent: 0')
    })
})
