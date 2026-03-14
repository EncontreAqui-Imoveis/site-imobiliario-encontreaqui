import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

describe('phoneInput helpers', () => {
    it('formats phone input with country code', () => {
        expect(formatPhoneInput('5564999999999')).toBe('+55 (64) 99999-9999')
    })

    it('normalizes phone to digits only', () => {
        expect(normalizePhoneDigits('+55 (64) 99999-9999')).toBe('5564999999999')
    })
})
