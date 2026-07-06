import { buildPublicPropertiesQuery } from '@/lib/propertyListingApi'

describe('propertyListingApi', () => {
    it('converte filtros de área em hectares para m² sem perder unidade no frontend', () => {
        const source = new URLSearchParams()
        source.set('areaUnit', 'hectare')
        source.set('minArea', '2')
        source.set('maxArea', '3')
        source.set('search', 'fazenda')

        const query = buildPublicPropertiesQuery(source, 2, 15)

        expect(query.get('status')).toBe('approved')
        expect(query.get('page')).toBe('2')
        expect(query.get('limit')).toBe('15')
        expect(query.get('search')).toBe('fazenda')
        expect(query.get('min_area_construida')).toBe('2')
        expect(query.get('max_area_construida')).toBe('3')
        expect(query.get('min_area_construida_unidade')).toBe('hectare')
        expect(query.get('max_area_construida_unidade')).toBe('hectare')
    })

    it('aceita alqueire como unidade informada e converte para m²', () => {
        const source = new URLSearchParams()
        source.set('areaUnit', 'alqueire')
        source.set('minArea', '1')
        source.set('maxArea', '2')

        const query = buildPublicPropertiesQuery(source, 1)

        expect(query.get('min_area_construida')).toBe('1')
        expect(query.get('max_area_construida')).toBe('2')
        expect(query.get('min_area_construida_unidade')).toBe('alqueire')
        expect(query.get('max_area_construida_unidade')).toBe('alqueire')
    })
})
