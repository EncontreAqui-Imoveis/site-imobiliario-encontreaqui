import React from 'react'
import { render, screen } from '@testing-library/react'
import PropertyInfo from '@/components/property/PropertyInfo'
import { Property } from '@/types/property'

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
    })
})
