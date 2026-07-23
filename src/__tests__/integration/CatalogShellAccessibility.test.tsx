import React, { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import HomePage from '@/app/page'
import PropertiesPage from '@/app/imoveis/page'
const mockPush = jest.fn()

jest.mock('next/link', () => {
    function MockNextLink({
        children,
        href,
        ...rest
    }: {
        children: ReactNode
        href: string
        [key: string]: unknown
    }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
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

jest.mock('@/components/home/HeroSection', () => {
    return function MockHeroSection() {
        return <section aria-label="Hero" data-testid="hero-section">Hero</section>
    }
})

jest.mock('@/components/home/HomeSections', () => ({
    FeaturedSection: function MockFeaturedSection() {
        return <section aria-label="Destaques" data-testid="featured-section">Featured</section>
    },
    FeaturedSkeleton: function MockFeaturedSkeleton() {
        return <div data-testid="featured-skeleton">Loading featured</div>
    },
    LaunchSection: function MockLaunchSection() {
        return <section aria-label="Lançamentos" data-testid="launch-section">Launches</section>
    },
    RecentSection: function MockRecentSection() {
        return <section aria-label="Recentes" data-testid="recent-section">Recent</section>
    },
    MostExpensiveSection: function MockMostExpensiveSection() {
        return <section aria-label="Mais caros" data-testid="most-expensive-section">Most expensive</section>
    },
    MostAffordableSection: function MockMostAffordableSection() {
        return <section aria-label="Mais baratos" data-testid="most-affordable-section">Most affordable</section>
    },
    OppositeDealSection: function MockOppositeDealSection() {
        return <section aria-label="Outro tipo de negócio" data-testid="opposite-deal-section">Opposite deal</section>
    },
    RecentSkeleton: function MockRecentSkeleton() {
        return <div data-testid="recent-skeleton">Loading recent</div>
    },
}))

jest.mock('@/components/home/AboutSection', () => {
    return function MockAboutSection() {
        return <section aria-label="Sobre" data-testid="about-section">About</section>
    }
})

jest.mock('@/components/auth/SignupDraftNotice', () => {
    return function MockSignupDraftNotice() {
        return null
    }
})

jest.mock('@/components/search/SearchFilters', () => {
    return function MockSearchFilters() {
        return (
            <aside aria-label="Filtros de busca" data-testid="search-filters">
                Filters
            </aside>
        )
    }
})

jest.mock('@/components/search/ActiveFilterChips', () => {
    return function MockActiveFilterChips() {
        return <div data-testid="active-filter-chips">Chips</div>
    }
})

jest.mock('@/components/property/PropertyGrid', () => {
    return function MockPropertyGrid({
        properties,
        isLoading,
    }: {
        properties: unknown[]
        isLoading?: boolean
    }) {
        return (
            <div data-testid="property-grid">
                {isLoading ? 'Loading' : `Items: ${properties.length}`}
            </div>
        )
    }
})

describe('catalog shell accessibility baseline', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the home page base sections', async () => {
        const ResolvedHomePage = await HomePage({})
        render(ResolvedHomePage)

        expect(screen.getByTestId('hero-section')).toBeInTheDocument()
        expect(screen.getByTestId('featured-section')).toBeInTheDocument()
        expect(screen.getByTestId('launch-section')).toBeInTheDocument()
        expect(screen.getByTestId('recent-section')).toBeInTheDocument()
        expect(screen.getByTestId('about-section')).toBeInTheDocument()
    })

    it('renders the properties page with named breadcrumb, filters and results landmarks', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        }) as jest.Mock
        window.fetch = global.fetch

        render(<PropertiesPage />)

        await screen.findByText('Items: 0')

        expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
        expect(
            screen.getByRole('complementary', { name: /filtros de busca/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('main', { name: /resultados de imóveis/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /imóveis no brasil/i })
        ).toBeInTheDocument()
    })
})
