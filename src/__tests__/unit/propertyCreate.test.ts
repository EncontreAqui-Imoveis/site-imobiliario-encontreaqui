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
            state: 'GO',
            city: 'Rio Verde',
            bairro: 'Centro',
            address: 'Rua 1',
            numero: '',
            complemento: 'Fundos',
            quadra: 'Q1',
            lote: 'L2',
            tipoLote: 'inteiro',
            semNumero: true,
            bedrooms: '0',
            bathrooms: '0',
            garageSpots: '0',
            areaConstruida: '0',
            areaTerreno: '360',
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
        expect(formData.get('tipo_lote')).toBe('inteiro')
        expect(formData.get('sem_numero')).toBe('1')
        expect(formData.get('tem_automacao')).toBe('1')
        expect(formData.get('video')).toBe(video)
        expect(formData.getAll('images')).toHaveLength(1)
    })
})
