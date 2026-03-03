/**
 * Tests for PropertyCard promotional price display
 */
import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'

jest.mock('next/link', () => {
    function MockNextLink({ children, href }: { children: ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('@/components/property/FavoriteButton', () => {
    function MockFav({ propertyId }: { propertyId: number }) {
        return <button data-testid="fav">{propertyId}</button>
    }
    MockFav.displayName = 'MockFav'
    return MockFav
})

jest.mock('lucide-react', () => new Proxy({}, {
    get: (_t, prop: string) => {
        const C = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
        C.displayName = prop
        return C
    },
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: function MockImg({ fill, ...props }: ComponentPropsWithoutRef<'img'> & { fill?: boolean }) {
        return React.createElement('img', { ...props, alt: props.alt ?? '', 'data-fill': fill ? 'true' : undefined })
    },
}))

const baseProperty: Property = {
    id: 1,
    title: 'Casa Teste',
    description: 'Desc',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda',
    price: 500000,
    priceSale: 500000,
    bairro: 'Centro',
    city: 'Goiânia',
    state: 'GO',
    bedrooms: 3,
    bathrooms: 2,
    garageSpots: 1,
    areaConstruida: 120,
    address: 'Rua A',
    images: ['/img.jpg'],
    createdAt: new Date().toISOString(),
}

describe('PropertyCard — Promotional Price', () => {
    it('shows normal price when no promotion', () => {
        render(<PropertyCard property={baseProperty} />)
        expect(screen.getByText(/R\$\s500\.000/)).toBeInTheDocument()
        expect(screen.queryByText(/line-through/)).not.toBeInTheDocument()
    })

    it('shows promo price with crossed-out original when promotion active', () => {
        const promoProperty: Property = {
            ...baseProperty,
            promotionPrice: 400000,
            promotionStart: new Date(Date.now() - 86400000).toISOString(),
            promotionEnd: new Date(Date.now() + 86400000).toISOString(),
        }
        render(<PropertyCard property={promoProperty} />)

        // Promo price visible
        expect(screen.getByText(/R\$\s400\.000/)).toBeInTheDocument()
        // Original crossed out
        const strikethrough = screen.getByText(/R\$\s500\.000/)
        expect(strikethrough.className).toContain('line-through')
    })

    it('shows normal price when promotion expired', () => {
        const expired: Property = {
            ...baseProperty,
            promotionPrice: 400000,
            promotionStart: new Date(Date.now() - 172800000).toISOString(),
            promotionEnd: new Date(Date.now() - 86400000).toISOString(),
        }
        render(<PropertyCard property={expired} />)

        // Only normal price, no green promo
        const priceEl = screen.getByText(/R\$\s500\.000/)
        expect(priceEl.className).not.toContain('line-through')
    })

    it('shows promo rent price for rental properties', () => {
        const rental: Property = {
            ...baseProperty,
            purpose: 'Aluguel',
            priceSale: undefined,
            priceRent: 3000,
            promotionalRentPrice: 2500,
        }
        render(<PropertyCard property={rental} />)

        expect(screen.getByText(/R\$\s2\.500/)).toBeInTheDocument()
        const original = screen.getByText(/R\$\s3\.000/)
        expect(original.className).toContain('line-through')
    })
})
