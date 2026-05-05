import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'

jest.mock('next/link', () => {
    function MockNextLink({
        children,
        href,
        ...rest
    }: { children: ReactNode; href: string; [key: string]: unknown }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

jest.mock('@/components/property/FavoriteButton', () => {
    function MockFavoriteButton({ propertyId }: { propertyId: number }) {
        return (
        <button data-testid="favorite-button" aria-label={`Favoritar imóvel ${propertyId}`}>♡</button>
        )
    }
    MockFavoriteButton.displayName = 'MockFavoriteButton'
    return MockFavoriteButton
})

jest.mock('lucide-react', () => ({
    Bed: () => <div data-testid="bed-icon" />,
    Bath: () => <div data-testid="bath-icon" />,
    Car: () => <div data-testid="car-icon" />,
    Maximize: () => <div data-testid="maximize-icon" />,
    MapPin: () => <div data-testid="map-pin-icon" />,
    ChevronLeft: () => <div data-testid="chevron-left" />,
    ChevronRight: () => <div data-testid="chevron-right" />,
}))

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

const mockProperty: Property = {
    id: 1,
    title: 'Test Property',
    description: 'Description',
    price: 1000000,
    priceSale: 1000000,
    public_code: 'AB12CD',
    slug: 'casa-com-quintal-rio-verde-AB12CD',
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
    brokerId: 1,
    createdAt: new Date().toISOString(),
}

describe('PropertyCard', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders property details correctly', () => {
        render(<PropertyCard property={mockProperty} />)

        expect(screen.getByText('Test Property')).toBeInTheDocument()
        expect(screen.getByText(/Test Neighborhood/)).toBeInTheDocument()
        expect(screen.getByText('3 Quartos')).toBeInTheDocument()
        expect(screen.getByText(/R\$\s1\.000\.000/)).toBeInTheDocument()
        expect(screen.getAllByText('Venda')[0]).toBeInTheDocument()
    })

    it('uses public slug in detail link', () => {
        const { container } = render(<PropertyCard property={mockProperty} />)
        const link = container.querySelector('a')

        expect(link).toHaveAttribute('href', '/imoveis/casa-com-quintal-rio-verde-AB12CD')
    })

    it('renders "Aluguel" badge correctly', () => {
        const rentProperty: Property = { ...mockProperty, purpose: 'Aluguel', priceSale: undefined, priceRent: 2000 }
        render(<PropertyCard property={rentProperty} />)
        expect(screen.getAllByText('Aluguel')[0]).toBeInTheDocument()
    })

    it('navigates through images', () => {
        render(<PropertyCard property={mockProperty} />)

        const nextButton = screen.getByLabelText('Próxima imagem')
        const img = screen.getByAltText('Test Property')

        expect(img).toHaveAttribute('src', '/img1.jpg')

        fireEvent.click(nextButton)
        expect(img).toHaveAttribute('src', '/img2.jpg')

        fireEvent.click(nextButton)
        expect(img).toHaveAttribute('src', '/img1.jpg')
    })

    it('shows favorite button', () => {
        render(<PropertyCard property={mockProperty} />)
        expect(screen.getByTestId('favorite-button')).toBeInTheDocument()
    })

    it('uses neutral highlight style in featured variant', () => {
        const { container } = render(<PropertyCard property={{ ...mockProperty, purpose: 'Aluguel' }} variant="featured" />)

        const card = container.querySelector('a')
        expect(card).toHaveClass('ring-slate-200')
        expect(card).not.toHaveClass('ring-accent-400')
    })
})
