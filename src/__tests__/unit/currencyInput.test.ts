import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput'

describe('currencyInput helpers', () => {
    it('formats digits as BRL input mask', () => {
        expect(formatCurrencyInput('123456')).toBe('R$\u00a01.234,56')
    })

    it('returns zero for empty masked value', () => {
        expect(parseCurrencyInput('')).toBe(0)
    })

    it('parses masked BRL values back to number', () => {
        expect(parseCurrencyInput('R$\u00a01.234,56')).toBe(1234.56)
    })

    it('clamps huge BRL values to the supported maximum', () => {
        expect(formatCurrencyInput('9999999999999999')).toBe('R$\u00a09.999.999.999,99')
        expect(parseCurrencyInput('R$\u00a099.999.999.999.999,99')).toBe(9999999999.99)
    })
})
