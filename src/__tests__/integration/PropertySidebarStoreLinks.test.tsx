import { render, screen } from '@testing-library/react'
import PropertySidebar from '@/components/property/PropertySidebar'
import { Property } from '@/types/property'
import { APP_LINKS } from '@/lib/appLinks'

jest.mock('lucide-react', () => ({
    Info: () => <div data-testid="icon-info" />,
    ShieldCheck: () => <div data-testid="icon-shield" />,
    Smartphone: () => <div data-testid="icon-smartphone" />,
    Download: () => <div data-testid="icon-download" />,
}))

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
    city: 'Rio Verde',
    state: 'GO',
    images: ['https://cdn/imovel.jpg'],
    createdAt: '2026-02-01T00:00:00.000Z',
    brokerName: 'Joao',
    code: 'A77',
}

describe('PropertySidebar store links', () => {
    it('renders app CTA and explicit Android/iOS store buttons', () => {
        render(<PropertySidebar property={property} />)

        const openApp = screen.getByRole('link', { name: /abrir este imóvel no app/i })
        const androidStore = screen.getByRole('link', { name: /baixar no android/i })
        const iosStore = screen.getByRole('link', { name: /baixar no ios/i })

        expect(openApp).toHaveAttribute('href', expect.stringContaining('77'))
        expect(androidStore).toHaveAttribute('href', APP_LINKS.androidStore)
        expect(iosStore).toHaveAttribute('href', APP_LINKS.iosStore)
    })
})
