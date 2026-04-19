/**
 * Unit tests for promotional price helpers in property.ts
 */
import {
    isPromotionActive,
    getPromoSalePrice,
    getPromoRentPrice,
    formatPrice,
    Property,
} from '@/types/property'

function makeProperty(overrides: Partial<Property> = {}): Property {
    return {
        id: 1,
        title: 'Test',
        description: 'Desc',
        type: 'Casa',
        status: 'approved',
        purpose: 'Venda',
        price: 500000,
        address: 'Rua A',
        city: 'Goiânia',
        state: 'GO',
        images: [],
        createdAt: new Date().toISOString(),
        ...overrides,
    }
}

describe('formatPrice', () => {
    it('formats number as BRL currency', () => {
        expect(formatPrice(250000)).toMatch(/250\.000/)
    })

    it('formats zero with centavos', () => {
        expect(formatPrice(0)).toMatch(/0[,.]00/)
    })
})

describe('isPromotionActive', () => {
    it('returns true when no start/end dates', () => {
        expect(isPromotionActive()).toBe(true)
        expect(isPromotionActive(undefined, undefined)).toBe(true)
    })

    it('returns true when within window', () => {
        const past = new Date(Date.now() - 86400000).toISOString()
        const future = new Date(Date.now() + 86400000).toISOString()
        expect(isPromotionActive(past, future)).toBe(true)
    })

    it('returns false when before start date', () => {
        const future = new Date(Date.now() + 86400000).toISOString()
        const farFuture = new Date(Date.now() + 172800000).toISOString()
        expect(isPromotionActive(future, farFuture)).toBe(false)
    })

    it('returns false when after end date', () => {
        const farPast = new Date(Date.now() - 172800000).toISOString()
        const past = new Date(Date.now() - 86400000).toISOString()
        expect(isPromotionActive(farPast, past)).toBe(false)
    })

    it('handles empty strings as undefined', () => {
        expect(isPromotionActive('', '')).toBe(true)
    })

    it('handles invalid date strings gracefully', () => {
        expect(isPromotionActive('not-a-date', 'also-not-a-date')).toBe(true)
    })
})

describe('getPromoSalePrice', () => {
    it('returns null when no promotion fields set', () => {
        const p = makeProperty()
        expect(getPromoSalePrice(p)).toBeNull()
    })

    it('returns promo price when set and lower than base', () => {
        const p = makeProperty({
            priceSale: 500000,
            promotionPrice: 400000,
            promotionStart: new Date(Date.now() - 86400000).toISOString(),
            promotionEnd: new Date(Date.now() + 86400000).toISOString(),
        })
        expect(getPromoSalePrice(p)).toBe(400000)
    })

    it('returns null when promo price equals base', () => {
        const p = makeProperty({
            priceSale: 500000,
            promotionPrice: 500000,
        })
        expect(getPromoSalePrice(p)).toBeNull()
    })

    it('returns null when promo price is higher than base', () => {
        const p = makeProperty({
            priceSale: 500000,
            promotionPrice: 600000,
        })
        expect(getPromoSalePrice(p)).toBeNull()
    })

    it('returns null when promotion window expired', () => {
        const p = makeProperty({
            priceSale: 500000,
            promotionPrice: 400000,
            promotionStart: new Date(Date.now() - 172800000).toISOString(),
            promotionEnd: new Date(Date.now() - 86400000).toISOString(),
        })
        expect(getPromoSalePrice(p)).toBeNull()
    })

    it('uses price as fallback when priceSale not set', () => {
        const p = makeProperty({
            price: 500000,
            promotionPrice: 400000,
        })
        expect(getPromoSalePrice(p)).toBe(400000)
    })
})

describe('getPromoRentPrice', () => {
    it('returns null when no promotional rent price set', () => {
        const p = makeProperty({ purpose: 'Aluguel', priceRent: 3000 })
        expect(getPromoRentPrice(p)).toBeNull()
    })

    it('returns promo rent price when set and lower than base', () => {
        const p = makeProperty({
            purpose: 'Aluguel',
            priceRent: 3000,
            promotionalRentPrice: 2500,
        })
        expect(getPromoRentPrice(p)).toBe(2500)
    })

    it('returns null when promo rent price exceeds base', () => {
        const p = makeProperty({
            purpose: 'Aluguel',
            priceRent: 3000,
            promotionalRentPrice: 3500,
        })
        expect(getPromoRentPrice(p)).toBeNull()
    })

    it('returns null when promotion window expired', () => {
        const p = makeProperty({
            purpose: 'Aluguel',
            priceRent: 3000,
            promotionalRentPrice: 2500,
            promotionEnd: new Date(Date.now() - 86400000).toISOString(),
        })
        expect(getPromoRentPrice(p)).toBeNull()
    })
})
