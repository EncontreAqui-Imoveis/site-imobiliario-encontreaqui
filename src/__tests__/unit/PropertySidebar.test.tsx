import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PropertySidebar from '@/components/property/PropertySidebar'
import { Property } from '@/types/property'

jest.mock('next/link', () => {
    return function MockNextLink({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode
        href: string
    }) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        )
    }
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

jest.mock('@/components/icons/WhatsAppIcon', () => {
    return function MockWhatsAppIcon() {
        return <div data-testid="whatsapp-icon" />
    }
})

jest.mock('@/lib/appLinks', () => ({
    buildAppDeepLink: jest.fn(() => 'app://property/1'),
    getStoreUrlClient: jest.fn(() => 'https://play.google.com/store'),
}))

jest.mock('@/lib/contactLinks', () => ({
    buildPhoneLink: jest.fn((phone?: string | null) => (phone ? `tel:${phone}` : null)),
    buildWhatsappLink: jest.fn((phone?: string | null) => (phone ? `https://wa.me/${phone}` : null)),
}))

const promoProperty: Property = {
    id: 1,
    title: 'Casa com promoção',
    description: 'Casa',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda e Aluguel',
    price: 0,
    priceSale: 232323,
    priceRent: 3500,
    address: 'Rua A',
    city: 'Rio Verde',
    state: 'GO',
    images: ['/img.jpg'],
    createdAt: new Date().toISOString(),
    brokerPhone: '64999999999',
    promotionPrice: 200000,
    promotionalRentPrice: 2800,
    promotionStart: new Date(Date.now() - 86400000).toISOString(),
    promotionEnd: new Date(Date.now() + 86400000).toISOString(),
}

const mockPropertyWithStats: Property = {
    ...promoProperty,
    bedrooms: 4,
    bathrooms: 3,
    garageSpots: 2,
    areaConstruida: 240,
    areaConstruidaUnidade: 'm2',
    areaTerreno: 450,
    areaTerrenoUnidade: 'm2',
}

describe('PropertySidebar', () => {
    it('exibe promoção ativa no detalhe com preço base riscado e período', () => {
        render(<PropertySidebar property={mockPropertyWithStats} visitorProposalHref="/propostas/nova?propertyId=1" />)

        expect(screen.getByText('Venda')).toBeInTheDocument()
        expect(screen.getByText('Aluguel')).toBeInTheDocument()
        expect(screen.getByText('R$ 232.323,00')).toBeInTheDocument()
        expect(screen.getByText('R$ 200.000,00')).toBeInTheDocument()
        expect(screen.getByText('R$ 3.500,00')).toBeInTheDocument()
        expect(screen.getByText('R$ 2.800,00')).toBeInTheDocument()
        expect(screen.getByText(/Promoção:/i)).toBeInTheDocument()
        expect(screen.getByText('Converse com nossos corretores oficiais e evite fraudes.')).toBeInTheDocument()
        expect(screen.getByText('Código do Imóvel')).toBeInTheDocument()
        expect(screen.getByText('Gerar proposta')).toBeInTheDocument()
        expect(screen.getByText('Falar pelo WhatsApp')).toBeInTheDocument()
        
        // Stats in sidebar
        expect(screen.getByText('4 Quartos')).toBeInTheDocument()
        expect(screen.getByText('3 Banheiros')).toBeInTheDocument()
        expect(screen.getByText('2 Garagens')).toBeInTheDocument()
        expect(screen.getByText('Área Construída:')).toBeInTheDocument()
        expect(screen.getByText('240 m²')).toBeInTheDocument()
        expect(screen.getByText('Área do Terreno:')).toBeInTheDocument()
        expect(screen.getByText('450 m²')).toBeInTheDocument()
    })
})
