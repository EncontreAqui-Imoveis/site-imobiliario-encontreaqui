import React, { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import HomePage from '@/app/page'
import PropertiesPage from '@/app/imoveis/page'

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
    RecentSection: function MockRecentSection() {
        return <section aria-label="Recentes" data-testid="recent-section">Recent</section>
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
        return <div data-testid="search-filters">Filters</div>
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

    it('renders the home page with a named main landmark', () => {
        render(<HomePage />)

        expect(
            screen.getByRole('main', { name: /página inicial do catálogo/i })
        ).toBeInTheDocument()
        expect(screen.getByTestId('hero-section')).toBeInTheDocument()
        expect(screen.getByTestId('featured-section')).toBeInTheDocument()
        expect(screen.getByTestId('recent-section')).toBeInTheDocument()
        expect(screen.getByTestId('about-section')).toBeInTheDocument()
    })

    it('renders the properties page with named breadcrumb, filters and results landmarks', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        }) as jest.Mock
        window.fetch = global.fetch

        render(await PropertiesPage({ searchParams: Promise.resolve({}) }))

        expect(
            screen.getByRole('navigation', { name: /breadcrumb/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('complementary', { name: /filtros de busca/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('main', { name: /resultados de imóveis/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /encontre seu imóvel ideal/i })
        ).toBeInTheDocument()
    })
})
