import React from 'react'
import { render, screen } from '@testing-library/react'
import PropertyInfo from '@/components/property/PropertyInfo'
import { Property } from '@/types/property'
import { PROPERTY_CANONICAL_AMENITIES } from '@/lib/propertyCreate'

jest.mock('lucide-react', () => {
    const MockIcon = () => <span data-testid="icon" />
    return new Proxy(
        {},
        {
            get: () => MockIcon,
        },
    )
})

const propertyMock: Property = {
    id: 10,
    title: 'Casa ampla',
    description: 'Descricao',
    price: 500000,
    priceSale: 500000,
    bairro: 'Centro',
    city: 'Goiânia',
    state: 'GO',
    address: 'Rua 1',
    numero: '100',
    quadra: 'Q1',
    lote: 'L2',
    complemento: 'Ap 2',
    cep: '74000-000',
    images: ['/img.jpg'],
    purpose: 'Venda',
    type: 'Casa',
    status: 'approved',
    brokerId: 1,
    createdAt: new Date().toISOString(),
    areaTerreno: 2000000,
    areaTerrenoUnidade: 'hectare',
}

describe('PropertyInfo', () => {
    it('exibe somente bairro e cidade na seção de localização detalhada', () => {
        render(<PropertyInfo property={propertyMock} />)

        expect(screen.getByText('Bairro')).toBeInTheDocument()
        expect(screen.getByText('Cidade')).toBeInTheDocument()
        expect(screen.queryByText('Endereço')).not.toBeInTheDocument()
        expect(screen.queryByText('Número')).not.toBeInTheDocument()
        expect(screen.queryByText('Quadra')).not.toBeInTheDocument()
        expect(screen.queryByText('Lote')).not.toBeInTheDocument()
        expect(screen.queryByText('Complemento')).not.toBeInTheDocument()
        expect(screen.queryByText('CEP')).not.toBeInTheDocument()
        expect(screen.queryByText(/Goiânia • GO/)).not.toBeInTheDocument()
        expect(screen.queryByText('Suítes')).not.toBeInTheDocument()
    })

    it('exibe área com unidade original', () => {
        render(<PropertyInfo property={propertyMock} />)

        expect(screen.getAllByText('200 ha')).toHaveLength(2)
    })

    it('exibe e deduplica as 16 amenidades entre flags e lista', () => {
        const propertyWithAmenities: Property = {
            ...propertyMock,
            hasWifi: true,
            temPiscina: true,
            temEnergiaSolar: true,
            temAutomacao: false,
            temArCondicionado: true,
            ehMobiliada: true,
            amenities: [
                'MOBILIADA',
                'POÇO ARTESIANO',
                'ACEITA PETS',
                'SISTEMA DE SEGURANÇA/CÂMERA',
            ],
        }

        render(<PropertyInfo property={propertyWithAmenities} />)

        expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
        expect(screen.getByText('Piscina')).toBeInTheDocument()
        expect(screen.getByText('Energia Solar')).toBeInTheDocument()
        expect(screen.getByText('Ar-condicionado')).toBeInTheDocument()
        expect(screen.getByText('Mobiliada')).toBeInTheDocument()
        expect(screen.getByText(/Poço Artesiano/i)).toBeInTheDocument()
        expect(screen.getByText(/Aceita pets/i)).toBeInTheDocument()
        expect(screen.getByText('Sistema de segurança/câmera')).toBeInTheDocument()
        expect(screen.getAllByText('Mobiliada')).toHaveLength(1)
        expect(screen.queryByText('Automação')).not.toBeInTheDocument()
    })

    it('exibe todas as comodidades quando o imóvel possuir todas as opções canônicas', () => {
        const propertyWithAllAmenities: Property = {
            ...propertyMock,
            amenities: [...PROPERTY_CANONICAL_AMENITIES],
        }

        render(<PropertyInfo property={propertyWithAllAmenities} />)

        const expectedLabels = [
            /Wi-Fi/i,
            /Piscina/i,
            /Energia Solar/i,
            /Automação/i,
            /Ar-condicionado/i,
            /Poço Artesiano/i,
            /Mobiliada/i,
            /Elevador/i,
            /Academia/i,
            /Churrasqueira/i,
            /Salão de festas/i,
            /Quadra/i,
            /Condomínio fechado/i,
            /Aceita pets/i,
            /Sistema de segurança\/c[âa]mera/i,
            /Sauna/i,
        ]

        for (const label of expectedLabels) {
            expect(screen.getByText(label)).toBeInTheDocument()
        }
    })
})
