import {
    normalizeProperty,
    fetchFeaturedProperties,
    fetchRecentProperties,
    fetchPropertyById,
} from '@/lib/propertiesApi'
import { apiClient, API_BASE_URL } from '@/lib/api/client'

describe('propertiesApi', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        document.cookie = ''
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('normalizes snake_case payload into Property shape', () => {
        const normalized = normalizeProperty({
            id: 10,
            title: 'Casa Teste',
            description: 'Descricao',
            type: 'Casa',
            status: 'approved',
            purpose: 'Venda',
            price: 100,
            area_construida_valor: 120,
            area_construida_unidade: 'm2',
            area_construida_m2: 120,
            area_terreno_valor: 2332,
            area_terreno_unidade: 'ha',
            area_terreno_m2: 23320000,
            price_sale: 300000,
            price_rent: 1800,
            address: 'Rua A',
            city: 'Brasil',
            state: 'GO',
            area_construida: 120,
            area_terreno: 250,
            garage_spots: 2,
            has_wifi: 1,
            tem_piscina: 0,
            tem_energia_solar: 1,
            tem_automacao: 1,
            tem_ar_condicionado: 0,
            eh_mobiliada: 1,
            public_code: 'AB12CD',
            slug: 'casa-com-quintal-rio-verde-AB12CD',
            valor_condominio: 0,
            valor_iptu: 900,
            promotion_price: 350000,
            promotion_start: '2026-01-01T00:00:00.000Z',
            promotion_end: '2026-01-31T23:59:59.000Z',
            images: [{ image_url: 'https://cdn/imovel.jpg' }],
            broker_id: 99,
            broker_name: 'Corretor',
            broker_phone: '64999999999',
            created_at: '2026-01-01T00:00:00.000Z',
            sem_cep: 1,
        })

        expect(normalized).not.toBeNull()
        expect(normalized?.id).toBe(10)
        expect(normalized?.priceSale).toBe(300000)
        expect(normalized?.priceRent).toBe(1800)
        expect(normalized?.areaConstruida).toBe(120)
        expect(normalized?.areaConstruidaValor).toBe(120)
        expect(normalized?.areaConstruidaUnidade).toBe('m2')
        expect(normalized?.areaTerreno).toBe(23320000)
        expect(normalized?.areaTerrenoValor).toBe(2332)
        expect(normalized?.areaTerrenoUnidade).toBe('hectare')
        expect(normalized?.public_code).toBe('AB12CD')
        expect(normalized?.slug).toBe('casa-com-quintal-rio-verde-AB12CD')
        expect(normalized?.promotionPrice).toBe(350000)
        expect(normalized?.promotionStart).toBe('2026-01-01T00:00:00.000Z')
        expect(normalized?.promotionEnd).toBe('2026-01-31T23:59:59.000Z')
        expect(normalized?.images[0]).toContain('https://cdn/imovel.jpg')
        expect(normalized?.brokerName).toBe('Corretor')
        expect(normalized?.semCep).toBe(true)
        expect(normalized?.temEnergiaSolar).toBe(true)
    })

    it('normalizes legacy cloudinary.co image urls to cloudinary.com', () => {
        const normalized = normalizeProperty({
            id: 11,
            title: 'Casa Legacy',
            type: 'Casa',
            status: 'approved',
            purpose: 'Venda',
            price: 100000,
            address: 'Rua A',
            city: 'Brasil',
            state: 'GO',
            images: [
                'https://res.cloudinary.co/demo/image/upload/v1/sample.jpg',
                'https://res.cloudinary.co',
            ],
            created_at: '2026-01-01T00:00:00.000Z',
        })

        expect(normalized?.images[0]).toBe('https://res.cloudinary.com/demo/image/upload/c_limit/w_1600/q_auto/f_auto/v1/sample.jpg')
        expect(normalized?.images).toHaveLength(1)
    })

    it('returns featured properties from API data payload', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                properties: [
                    {
                        id: 1,
                        title: 'Imóvel 1',
                        type: 'Casa',
                        status: 'approved',
                        purpose: 'Venda',
                        price: 200000,
                        address: 'Rua B',
                        city: 'Brasil',
                        state: 'GO',
                        images: ['https://cdn/1.jpg'],
                        created_at: '2026-01-01T00:00:00.000Z',
                    },
                ],
            }),
        })

        const result = await fetchFeaturedProperties(1, 'sale')

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/properties/featured?'),
            expect.objectContaining({ next: { revalidate: 60 } })
        )
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Imóvel 1')
    })

    it('returns recent properties when endpoint is successful', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                properties: [
                    {
                        id: 3,
                        title: 'Imóvel 3',
                        type: 'Apartamento',
                        status: 'approved',
                        purpose: 'Aluguel',
                        price: 2500,
                        address: 'Rua C',
                        city: 'Brasil',
                        state: 'GO',
                        images: ['https://cdn/3.jpg'],
                        created_at: '2026-01-01T00:00:00.000Z',
                    },
                ],
            }),
        })

        const result = await fetchRecentProperties(1)
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(3)
    })

    it('returns empty array when listing endpoint fails', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 503,
            headers: new Headers({
                'Content-Type': 'application/json',
                'x-request-id': 'req-public-503',
            }),
            json: async () => ({
                message: 'Serviço indisponível',
            }),
        })
        await expect(fetchFeaturedProperties()).resolves.toEqual([])
        await expect(fetchRecentProperties()).resolves.toEqual([])
    })

    it('normaliza alias legado de segurança/câmera para câmera ao ler propriedade', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 22,
                    title: 'Casa com câmera legado',
                    type: 'Casa',
                    status: 'approved',
                    purpose: 'Venda',
                    price: 300000,
                    address: 'Rua Z',
                    city: 'Brasil',
                    state: 'GO',
                    amenities: ['SISTEMA DE SEGURANÇA/CÂMARA'],
                    images: ['https://cdn/22.jpg'],
                    created_at: '2026-01-01T00:00:00.000Z',
                },
            }),
        })

        const result = await fetchPropertyById(22)

        expect(result?.amenities).toContain('SISTEMA DE SEGURANÇA/CÂMERA')
        expect(result?.amenities).not.toContain('SISTEMA DE SEGURANÇA/CÂMARA')
    })

    it('fetches property by id and unwraps data field', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 44,
                    title: 'Imóvel 44',
                    type: 'Casa',
                    status: 'approved',
                    purpose: 'Venda',
                    price: 700000,
                    address: 'Rua D',
                    city: 'Brasil',
                    state: 'GO',
                    images: ['https://cdn/44.jpg'],
                    created_at: '2026-01-01T00:00:00.000Z',
                },
            }),
        })

        const result = await fetchPropertyById('44')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/public/properties/44'),
            expect.objectContaining({ cache: 'no-store' })
        )
        expect(result?.title).toBe('Imóvel 44')
    })

    it('fetches property by slug/public_code', async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    id: 99,
                    public_code: 'AB12CD',
                    slug: 'casa-com-quintal-rio-verde-AB12CD',
                    title: 'Casa com quintal',
                    type: 'Casa',
                    status: 'approved',
                    purpose: 'Venda',
                    price: 600000,
                    address: 'Rua L',
                    city: 'Brasília',
                    state: 'GO',
                    images: ['https://cdn/99.jpg'],
                    created_at: '2026-01-01T00:00:00.000Z',
                },
            }),
        })

        const result = await fetchPropertyById('casa-com-quintal-rio-verde-AB12CD')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/public/properties/casa-com-quintal-rio-verde-AB12CD'),
            expect.objectContaining({ cache: 'no-store' })
        )
        expect(result?.public_code).toBe('AB12CD')
        expect(result?.slug).toBe('casa-com-quintal-rio-verde-AB12CD')
    })

    it('fallbacks to authenticated endpoint when property is not public and user has token', async () => {
        const publicFailure = {
            ok: false,
            status: 404,
            headers: new Headers({
                'Content-Type': 'application/json',
                'x-request-id': 'req-private-404',
            }),
            json: async () => ({ message: 'Não encontrado' }),
        }
        ; (global.fetch as jest.Mock).mockResolvedValue(publicFailure)

        const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
            id: 66,
            title: 'Imóvel privado',
            type: 'Casa',
            status: 'pending_approval',
            purpose: 'Venda',
            price: 450000,
            address: 'Rua Z',
            city: 'Goiânia',
            state: 'GO',
            created_at: '2026-01-06T12:00:00.000Z',
            owner_id: 99,
        })
        document.cookie = 'ea_auth_token=token-de-teste'

        const result = await fetchPropertyById('66')

        expect(global.fetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/public/properties/66`,
            expect.objectContaining({ cache: 'no-store' }),
        )
        expect(getSpy).toHaveBeenCalledWith('/properties/66')
        expect(result?.status).toBe('pending_approval')
        expect(result?.ownerId).toBe(99)
    })

    it('fallbacks to authenticated endpoint when public endpoint returns sucesso sem dados úteis', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                message: 'Não encontrado',
                status: 'not_found',
            }),
        })
        const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
            id: 77,
            title: 'Imóvel privado sem retorno público',
            type: 'Casa',
            status: 'pending_approval',
            purpose: 'Venda',
            price: 350000,
            address: 'Rua Q',
            city: 'Goiânia',
            state: 'GO',
            created_at: '2026-01-07T12:00:00.000Z',
            owner_id: 101,
        })
        document.cookie = 'ea_auth_token=token-de-teste'

        const result = await fetchPropertyById('77')

        expect(global.fetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/public/properties/77`,
            expect.objectContaining({ cache: 'no-store' }),
        )
        expect(getSpy).toHaveBeenCalledWith('/properties/77')
        expect(result?.status).toBe('pending_approval')
        expect(result?.ownerId).toBe(101)
    })

    it('consumes public detail payload when the backend returns the property object directly', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 55,
                title: 'Imóvel 55',
                type: 'Casa',
                status: 'approved',
                purpose: 'Venda e Aluguel',
                price: 500000,
                price_sale: 500000,
                price_rent: 3200,
                address: 'Rua E',
                city: 'Brasil',
                state: 'GO',
                bairro: 'Centro',
                broker_name: 'Corretor Público',
                broker_phone: '64988887777',
                images: ['https://cdn/55-a.jpg', 'https://cdn/55-b.jpg'],
                created_at: '2026-01-01T00:00:00.000Z',
            }),
        })

        const result = await fetchPropertyById(55)

        expect(result).not.toBeNull()
        expect(result?.id).toBe(55)
        expect(result?.priceSale).toBe(500000)
        expect(result?.priceRent).toBe(3200)
        expect(result?.brokerName).toBe('Corretor Público')
        expect(result?.brokerPhone).toBe('64988887777')
        expect(result?.images).toEqual([
            'https://cdn/55-a.jpg',
            'https://cdn/55-b.jpg',
        ])
    })
})
