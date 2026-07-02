import { maskCpf, maskPhone, maskEmail, maskCreci, formatCpf, formatPhone, isValidCpf } from '@/lib/privacy'

describe('maskCpf', () => {
    it('masks a full CPF showing only partial last digits', () => {
        const result = maskCpf('12345678900')
        expect(result).toMatch(/^\*{3}\.\*{3}\.\*/)
        expect(result).not.toContain('123')
    })

    it('returns fallback for short CPF', () => {
        expect(maskCpf('123')).toBe('***.***.***-**')
    })

    it('handles already-formatted CPF (with dots and dash)', () => {
        const result = maskCpf('123.456.789-00')
        expect(result).toMatch(/^\*{3}\.\*{3}\.\*/)
    })

    it('never reveals the first 8 digits', () => {
        const result = maskCpf('12345678900')
        expect(result).not.toContain('1234')
    })
})

describe('maskPhone', () => {
    it('shows only last 4 digits', () => {
        const result = maskPhone('11987654321')
        expect(result).toContain('4321')
        expect(result).not.toContain('9876')
    })

    it('returns fallback for short phone', () => {
        expect(maskPhone('12')).toBe('(••) •••••-••••')
    })
})

describe('maskEmail', () => {
    it('masks local part showing first and last char', () => {
        const result = maskEmail('joao.silva@gmail.com')
        expect(result).toMatch(/^j\*{1,3}a@gmail\.com$/)
    })

    it('handles short local part (≤2 chars)', () => {
        const result = maskEmail('ab@gmail.com')
        expect(result).toContain('a')
        expect(result).toContain('@gmail.com')
    })

    it('returns fallback for input without @', () => {
        expect(maskEmail('invalid')).toBe('***@***')
    })
})

describe('maskCreci', () => {
    it('shows only last 3 characters', () => {
        const result = maskCreci('12345-F')
        expect(result).toBe('***5-F')
    })

    it('returns *** for very short CRECI', () => {
        expect(maskCreci('AB')).toBe('***')
    })
})

describe('formatCpf', () => {
    it('formats 11 digits as 000.000.000-00', () => {
        expect(formatCpf('12345678900')).toBe('123.456.789-00')
    })

    it('handles partial input (3 digits)', () => {
        expect(formatCpf('123')).toBe('123')
    })

    it('handles 6 digits', () => {
        expect(formatCpf('123456')).toBe('123.456')
    })

    it('strips non-digit characters', () => {
        expect(formatCpf('123.456.789-00')).toBe('123.456.789-00')
    })
})

describe('isValidCpf', () => {
    it('accepts a valid CPF with check digits', () => {
        expect(isValidCpf('529.982.247-25')).toBe(true)
        expect(isValidCpf('52998224725')).toBe(true)
    })

    it('rejects repeated digits', () => {
        expect(isValidCpf('111.111.111-11')).toBe(false)
    })

    it('rejects CPF with invalid check digits', () => {
        expect(isValidCpf('12345678900')).toBe(false)
    })
})

describe('formatPhone', () => {
    it('formats 11 digits as (00) 00000-0000', () => {
        expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    })

    it('handles partial input (2 digits)', () => {
        expect(formatPhone('11')).toBe('11')
    })
})
