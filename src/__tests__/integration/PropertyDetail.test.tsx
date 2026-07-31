import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PropertyDetailClient from '@/components/property/PropertyDetailClient'
import { Property } from '@/types/property'
import * as propertiesApi from '@/lib/propertiesApi'
import * as contractsApi from '@/lib/api/contracts'

jest.mock('@/lib/propertiesApi', () => ({
    ...jest.requireActual('@/lib/propertiesApi'),
    fetchPropertyById: jest.fn(),
}))

jest.mock('@/lib/api/contracts', () => ({
    getMyContracts: jest.fn(),
}))

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('next/link', () => {
    function MockNextLink({ children, href }: { children: ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
    MockNextLink.displayName = 'MockNextLink'
    return MockNextLink
})

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

jest.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (_target, prop: string) => {
            const Comp = () => <div data-testid={`icon-${prop.toLowerCase()}`} />
            Comp.displayName = prop
            return Comp
        },
    })
})

jest.mock('@/components/property/PropertyCard', () => {
    return function MockPropertyCard({ property }: { property: Property }) {
        return (
            <div
                data-testid="property-card"
                data-image={property.images?.[0] ?? ''}
            >
                {property.title}
            </div>
        )
    }
})

// Mock components to avoid deep rendering complexity
jest.mock('@/components/property/PropertyGallery', () => {
    return function MockGallery({ title }: { title: string }) {
        return <div data-testid="property-gallery">{title}</div>
    }
})

jest.mock('@/components/property/PropertyInfo', () => {
    return function MockInfo({ property }: { property: Property }) {
        return <div data-testid="property-info">{property.description}</div>
    }
})

jest.mock('@/components/property/PropertySidebar', () => {
    return function MockSidebar() {
        return <div data-testid="property-sidebar">Sidebar</div>
    }
})

jest.mock('@/components/property/CloseDealDialog', () => {
    return function MockCloseDealDialog() {
        return null
    }
})

let mockUserContextValue: { session: unknown } = {
    session: null,
}

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        session: mockUserContextValue.session,
        loading: false,
        isBroker: false,
        isAuthenticated: Boolean(mockUserContextValue.session),
    }),
}))

const mockProperty: Property = {
    id: 1,
    title: 'Luxury Villa',
    description: 'Beautiful villa with pool',
    price: 2500000,
    priceSale: 2500000,
    bairro: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    bedrooms: 4,
    bathrooms: 5,
    garageSpots: 3,
    areaConstruida: 450,
    images: ['/img1.jpg'],
    purpose: 'Venda',
    type: 'Casa',
    status: 'approved',
    brokerId: 101,
    createdAt: new Date().toISOString(),

    brokerPhone: '11999998888',
    hasWifi: true,
    temPiscina: true,
    address: 'Rua das Flores, 123'
}

function createDeferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

describe('PropertyDetailClient', () => {
    beforeEach(() => {
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        })
        mockUserContextValue = { session: null }
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({}),
        })
        window.fetch = global.fetch
        ;(propertiesApi.fetchPropertyById as jest.Mock).mockResolvedValue(mockProperty)
        ;(contractsApi.getMyContracts as jest.Mock).mockResolvedValue([])
    })

    afterEach(() => {
        jest.clearAllMocks()
        ;(contractsApi.getMyContracts as jest.Mock).mockResolvedValue([])
    })

    it('renders property details', () => {
        render(<PropertyDetailClient propertyId="1" initialProperty={mockProperty} />)

        expect(
            screen.getByRole('main', { name: /detalhes do imóvel luxury villa/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('navigation', { name: /breadcrumb/i })
        ).toBeInTheDocument()
        expect(screen.getAllByText('Luxury Villa')[0]).toBeInTheDocument()
        expect(screen.getByTestId('property-gallery')).toBeInTheDocument()
        expect(screen.getByTestId('property-info')).toBeInTheDocument()
        expect(screen.getByTestId('property-sidebar')).toBeInTheDocument()

        // Breadcrumb
        expect(screen.getByText('Imóveis')).toBeInTheDocument()
    })

    it('carrega versão privada do imóvel para proprietário autenticado quando propriedade inicial está ausente', async () => {
        mockUserContextValue = {
            session: {
                user: {
                    id: 101,
                    role: 'client',
                    email: 'proprietario@teste.com',
                },
            },
        }
        const ownedProperty: Property = {
            ...mockProperty,
            id: 88,
            title: 'Imóvel reservado',
            status: 'pending_approval',
        }
        const fetchPropertyByIdMock = propertiesApi.fetchPropertyById as jest.Mock
        fetchPropertyByIdMock.mockResolvedValue(ownedProperty)

        render(<PropertyDetailClient propertyId="ACTME2" initialProperty={null} />)

        await waitFor(() => {
            expect(screen.getByTestId('property-gallery')).toHaveTextContent('Imóvel reservado')
        })
        expect(screen.queryByText('Imóvel não encontrado.')).not.toBeInTheDocument()
        expect(fetchPropertyByIdMock.mock.calls.flat()).toContain('ACTME2')
    })

    it('não mostra gerar proposta antes de carregar a versão privada do proprietário', async () => {
        mockUserContextValue = {
            session: {
                user: {
                    id: 101,
                    role: 'client',
                    email: 'proprietario@teste.com',
                },
            },
        }

        const deferred = createDeferred<Property>()
        const fetchPropertyByIdMock = propertiesApi.fetchPropertyById as jest.Mock
        fetchPropertyByIdMock.mockReturnValue(deferred.promise)

        render(
            <PropertyDetailClient
                propertyId="ACTME2"
                initialProperty={{
                    ...mockProperty,
                    ownerId: 101,
                    title: 'Imóvel reservado',
                    status: 'approved',
                }}
            />,
        )

        expect(screen.getByText('Carregando proposta')).toBeInTheDocument()
        expect(screen.queryByText('Gerar proposta')).not.toBeInTheDocument()

        deferred.resolve({
            ...mockProperty,
            ownerId: 101,
            title: 'Imóvel reservado',
            status: 'approved',
            negotiation: {
                id: 'neg-2',
                status: 'PROPOSAL_SIGNED',
            },
        } as Property)

        await waitFor(() => {
            expect(screen.getByText('Status da proposta')).toBeInTheDocument()
        })
        expect(screen.queryByText('Gerar proposta')).not.toBeInTheDocument()
    })

    it('bloqueia novo ciclo quando existe contrato físico ativo', async () => {
        mockUserContextValue = {
            session: { user: { id: 700, role: 'client' } },
        }
        ;(contractsApi.getMyContracts as jest.Mock).mockResolvedValue([])

        render(
            <PropertyDetailClient
                propertyId="1"
                initialProperty={{
                    ...mockProperty,
                    ownerId: 101,
                    latestContractId: 'contract-1',
                    latestContractStatus: 'IN_DRAFT',
                    negotiation: { id: 'neg-1', status: 'APPROVED' },
                }}
            />,
        )

        await waitFor(() => {
            expect(screen.queryByText('Criar proposta')).not.toBeInTheDocument()
        })
        expect(screen.queryByText('Gerar proposta')).not.toBeInTheDocument()
    })

    it('mostra contrato autorizado e libera somente a navegação correspondente', async () => {
        mockUserContextValue = {
            session: { user: { id: 700, role: 'client' } },
        }
        ;(contractsApi.getMyContracts as jest.Mock).mockResolvedValue([
            { id: 'contract-1', propertyId: 1, status: 'IN_DRAFT' },
        ])

        render(
            <PropertyDetailClient
                propertyId="1"
                initialProperty={{
                    ...mockProperty,
                    latestContractId: 'contract-1',
                    latestContractStatus: 'IN_DRAFT',
                }}
            />,
        )

        const contractLinks = await screen.findAllByRole('link', { name: /ver contrato/i })
        expect(contractLinks[0]).toHaveAttribute('href', '/meus-processos/contratos/contract-1')
        expect(screen.queryByText('Gerar proposta')).not.toBeInTheDocument()
    })

    it('exibe não encontrado para usuário sem sessão quando não há imóvel inicial', () => {
        mockUserContextValue = { session: null }
        render(<PropertyDetailClient propertyId="999" initialProperty={null} />)

        expect(screen.getByText('Imóvel não encontrado.')).toBeInTheDocument()
        expect(propertiesApi.fetchPropertyById).not.toHaveBeenCalled()
    })

    it('fetches and renders similar properties', async () => {
        const mockSimilar: Property[] = [
            { ...mockProperty, id: 2, title: 'Similar House 1' },
            { ...mockProperty, id: 3, title: 'Similar House 2' }
        ]

        render(
            <PropertyDetailClient
                propertyId="1"
                initialProperty={mockProperty}
                initialSimilarProperties={mockSimilar}
            />
        )

        // Check if similar properties were rendered
        expect(screen.getByText('Similar House 1')).toBeInTheDocument()
        expect(screen.getByText('Similar House 2')).toBeInTheDocument()
    })

    it('normaliza urls legadas nas propriedades similares antes de renderizar', async () => {
        const mockSimilarProperty = propertiesApi.normalizeProperty(
            {
                ...mockProperty,
                id: 2,
                title: 'Similar House Legacy',
                images: ['https://res.cloudinary.co/demo/image/upload/legacy.jpg'],
            },
            { imagePreset: 'thumb' }
        ) as Property

        render(
            <PropertyDetailClient
                propertyId="1"
                initialProperty={mockProperty}
                initialSimilarProperties={[mockSimilarProperty]}
            />
        )

        expect(screen.getByTestId('property-card')).toHaveAttribute(
            'data-image',
            'https://res.cloudinary.com/demo/image/upload/c_limit/w_480/q_auto/f_auto/legacy.jpg',
        )
    })
})
