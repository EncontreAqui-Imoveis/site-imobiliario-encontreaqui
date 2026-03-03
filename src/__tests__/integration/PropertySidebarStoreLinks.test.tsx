import { render, screen } from '@testing-library/react'
import PropertySidebar from '@/components/property/PropertySidebar'
import { Property } from '@/types/property'

// Mock next/link
jest.mock('next/link', () => {
    function MockNextLink({ children, href, ...rest }: { children: React.ReactNode; href: string;[key: string]: unknown }) {
        return <a href={href} {...rest}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

// Mock all lucide-react icons
jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
            Comp.displayName = prop
            return Comp
        },
    })
})

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: null,
        loading: false,
        isBroker: false,
        isAuthenticated: false,
    }),
}))

// Mock FavoriteButton
jest.mock('@/components/property/FavoriteButton', () => {
    return function MockFavoriteButton() {
        return <div data-testid="favorite-button" />
    }
})

const property: Property = {
    id: 77,
    title: 'Casa Modelo',
    description: 'Descricao',
    type: 'Casa',
    status: 'approved',
    purpose: 'Venda',
    price: 350000,
    priceSale: 350000,
    address: 'Rua Teste',
    city: 'Brasil',
    state: 'GO',
    images: ['https://cdn/imovel.jpg'],
    createdAt: '2026-02-01T00:00:00.000Z',
    brokerName: 'Joao',
    code: 'A77',
}

describe('PropertySidebar store links', () => {
    it('renders the "Ver no Aplicativo" deep link containing the property ID', () => {
        render(<PropertySidebar property={property} />)

        expect(
            screen.getByRole('complementary', { name: /resumo e ações do imóvel/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('region', { name: /ações do aplicativo/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('region', { name: /download do aplicativo/i })
        ).toBeInTheDocument()

        const appLink = screen.getByText(/ver no aplicativo/i).closest('a')
        expect(appLink).toHaveAttribute('href', expect.stringContaining('77'))
        expect(appLink).toHaveAttribute(
            'aria-label',
            expect.stringContaining('Casa Modelo')
        )
    })

    it('renders the app download CTA with a store URL', () => {
        render(<PropertySidebar property={property} />)

        const downloadLink = screen.getByText(/baixar o app/i).closest('a')
        expect(downloadLink).toHaveAttribute('href', expect.stringMatching(/play\.google|apple\.com/))
        expect(downloadLink).toHaveAttribute(
            'aria-label',
            'Baixar o aplicativo Encontre Aqui Imóveis'
        )
    })

    it('renders proposal and messaging CTAs with accessible names tied to the property', () => {
        render(<PropertySidebar property={{ ...property, brokerPhone: '62999998888' }} />)

        expect(
            screen.getByRole('link', { name: /falar pelo whatsapp sobre casa modelo/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /entrar para fazer proposta para casa modelo/i })
        ).toBeInTheDocument()
    })
})
