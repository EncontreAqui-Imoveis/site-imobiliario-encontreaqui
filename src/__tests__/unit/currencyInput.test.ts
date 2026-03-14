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
})
