import { buildPublicPropertyUrl, getPublicPropertySlug } from '@/lib/propertyLinks'
import { Property } from '@/types/property'

function asProperty(partial: Partial<Property>): Property {
    return {
        id: 77,
        title: 'Imóvel Teste',
        description: 'Descricao',
        type: 'Casa',
        status: 'approved',
        purpose: 'Venda',
        price: 100000,
        address: 'Rua Teste',
        city: 'Cidade',
        state: 'GO',
        images: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        brokerName: 'Corretor Teste',
        ...partial,
    }
}

describe('propertyLinks', () => {
    it('usa o slug quando disponível', () => {
        const property = asProperty({ slug: 'casa-exemplo-rio' })
        expect(getPublicPropertySlug(property)).toBe('casa-exemplo-rio')
        expect(buildPublicPropertyUrl(property)).toBe('/imoveis/casa-exemplo-rio')
    })

    it('usa public_code quando slug não existe', () => {
        const property = asProperty({ public_code: 'AB12CD', slug: undefined })
        expect(getPublicPropertySlug(property)).toBe('AB12CD')
        expect(buildPublicPropertyUrl(property)).toBe('/imoveis/AB12CD')
    })

    it('não expõe id interno quando não há referência pública', () => {
        const property = asProperty({ slug: undefined, public_code: undefined, id: 77 })
        expect(getPublicPropertySlug(property)).toBe('')
        expect(buildPublicPropertyUrl(property)).toBe('/imoveis')
    })
})
