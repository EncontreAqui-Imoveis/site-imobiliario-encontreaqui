import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

describe('phoneInput helpers', () => {
    it('formats phone input without country code', () => {
        expect(formatPhoneInput('5564999999999')).toBe('(64) 99999-9999')
        expect(formatPhoneInput('(64)999999999')).toBe('(64) 99999-9999')
    })

    it('normalizes phone to digits with brazil country code', () => {
        expect(normalizePhoneDigits('(64) 99999-9999')).toBe('5564999999999')
        expect(normalizePhoneDigits('+55 (64) 99999-9999')).toBe('5564999999999')
    })
})
