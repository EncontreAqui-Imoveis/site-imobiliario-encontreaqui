import {
    buildCreatePropertyFormData,
    requiresLotFields,
    resolveCreatePropertyPath,
    supportsRent,
    supportsSale,
} from '@/lib/propertyCreate'

describe('propertyCreate helpers', () => {
    it('uses the correct endpoint for client-owner flow', () => {
        expect(resolveCreatePropertyPath('client-owner')).toBe('/properties/client')
        expect(resolveCreatePropertyPath('broker')).toBe('/properties')
    })

    it('detects purpose rules correctly', () => {
        expect(supportsSale('Venda')).toBe(true)
        expect(supportsRent('Aluguel')).toBe(true)
        expect(supportsSale('Venda e Aluguel')).toBe(true)
        expect(supportsRent('Venda e Aluguel')).toBe(true)
    })

    it('requires lot metadata for terreno', () => {
        expect(requiresLotFields('Terreno')).toBe(true)
        expect(requiresLotFields('Casa')).toBe(false)
    })

    it('builds the same snake_case FormData contract expected by backend/mobile', () => {
        const image = new File(['img'], 'front.jpg', { type: 'image/jpeg' })
        const video = new File(['video'], 'tour.mp4', { type: 'video/mp4' })

        const formData = buildCreatePropertyFormData({
            actorMode: 'client-owner',
            propertyType: 'Terreno',
            purpose: 'Venda e Aluguel',
            title: 'Lote no centro',
            description: 'Amplo e pronto para construir.',
            ownerName: 'Ana Silva',
            ownerPhone: '(64) 99999-9999',
            priceSale: '250000',
            priceRent: '1500',
            cep: '75900-000',
            semCep: false,
            state: 'GO',
            city: 'Rio Verde',
            bairro: 'Centro',
            address: 'Rua 1',
            numero: '',
            complemento: 'Fundos',
            quadra: 'Q1',
            lote: 'L2',
            semNumero: true,
            semQuadra: false,
            semLote: false,
            bedrooms: '0',
            bathrooms: '0',
            garageSpots: '0',
            areaConstruida: '0',
            areaConstruidaUnidade: 'm2',
            areaTerreno: '360',
            areaTerrenoUnidade: 'hectare',
            hasWifi: false,
            temPiscina: false,
            temAutomacao: true,
            temArCondicionado: false,
            ehMobiliada: false,
            images: [image],
            video,
        })

        expect(formData.get('title')).toBe('Lote no centro')
        expect(formData.get('purpose')).toBe('Venda e Aluguel')
        expect(formData.get('price')).toBe('250000')
        expect(formData.get('price_sale')).toBe('250000')
        expect(formData.get('price_rent')).toBe('1500')
        expect(formData.get('owner_name')).toBe('Ana Silva')
        expect(formData.get('owner_phone')).toBe('64999999999')
        expect(formData.get('sem_cep')).toBe('0')
        expect(formData.get('sem_numero')).toBe('1')
        expect(formData.get('sem_quadra')).toBe('0')
        expect(formData.get('sem_lote')).toBe('0')
        expect(formData.get('area_construida_unidade')).toBe('m2')
        expect(formData.get('area_terreno_unidade')).toBe('hectare')
        expect(formData.get('bedrooms')).toBe('0')
        expect(formData.get('bathrooms')).toBe('0')
        expect(formData.get('garage_spots')).toBe('0')
        expect(formData.get('tem_automacao')).toBe('1')
        expect(formData.get('video')).toBe(video)
        expect(formData.getAll('images')).toHaveLength(1)
    })

    it('preserves a 500-character description without expanding HTML entities', () => {
        const description = `${'a'.repeat(499)}'`
        expect(description).toHaveLength(500)

        const formData = buildCreatePropertyFormData({
            actorMode: 'broker',
            propertyType: 'Casa',
            purpose: 'Venda',
            title: 'Casa térrea',
            description,
            ownerName: '',
            ownerPhone: '',
            priceSale: '250000',
            priceRent: '',
            cep: '75900-000',
            semCep: false,
            state: 'GO',
            city: 'Rio Verde',
            bairro: 'Centro',
            address: 'Rua A',
            numero: '123',
            complemento: '',
            quadra: '',
            lote: '',
            semNumero: false,
            semQuadra: false,
            semLote: false,
            bedrooms: '3',
            bathrooms: '2',
            garageSpots: '2',
            areaConstruida: '180',
            areaConstruidaUnidade: 'm2',
            areaTerreno: '250',
            areaTerrenoUnidade: 'm2',
            hasWifi: false,
            temPiscina: false,
            temAutomacao: false,
            temArCondicionado: false,
            ehMobiliada: false,
            images: [new File(['img'], 'front.jpg', { type: 'image/jpeg' })],
            video: null,
        })

        expect(formData.get('description')).toBe(description)
        expect(String(formData.get('description'))).toHaveLength(500)
    })
})
