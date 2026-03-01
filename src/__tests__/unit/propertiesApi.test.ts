import {
    normalizeProperty,
    fetchFeaturedProperties,
    fetchRecentProperties,
    fetchPropertyById,
} from '@/lib/propertiesApi'

describe('propertiesApi', () => {
    beforeEach(() => {
        jest.clearAllMocks()
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
            valor_condominio: 0,
            valor_iptu: 900,
            images: [{ image_url: 'https://cdn/imovel.jpg' }],
            broker_id: 99,
            broker_name: 'Corretor',
            broker_phone: '64999999999',
            created_at: '2026-01-01T00:00:00.000Z',
            tipo_lote: 'inteiro',
        })

        expect(normalized).not.toBeNull()
        expect(normalized?.id).toBe(10)
        expect(normalized?.priceSale).toBe(300000)
        expect(normalized?.priceRent).toBe(1800)
        expect(normalized?.areaConstruida).toBe(120)
        expect(normalized?.images[0]).toContain('https://cdn/imovel.jpg')
        expect(normalized?.brokerName).toBe('Corretor')
        expect(normalized?.tipoLote).toBe('inteiro')
    })

    it('returns featured properties from API data payload', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
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

        const result = await fetchFeaturedProperties(1)

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/properties?'),
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
        ; (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
        await expect(fetchFeaturedProperties()).resolves.toEqual([])
        await expect(fetchRecentProperties()).resolves.toEqual([])
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
})
