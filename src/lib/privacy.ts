/**
 * Privacy utilities for masking PII (Personally Identifiable Information).
 * LGPD-compliant frontend data minimization.
 */

/**
 * Mask a CPF number, showing only last 2 digits.
 * Input: "123.456.789-00" or "12345678900"
 * Output: "***.***.**9-00"
 */
export function maskCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length < 11) return '***.***.***-**'
    return `***.***.*${digits[8]}${digits[9]}-${digits[9]}${digits[10]}`
}

/**
 * Mask a phone number, showing only last 4 digits.
 * Input: "(11) 98765-4321" or "11987654321"
 * Output: "(••) •••••-4321"
 */
export function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 4) return '(••) •••••-••••'
    const lastFour = digits.slice(-4)
    return `(••) •••••-${lastFour}`
}

/**
 * Mask an email address.
 * Input: "joao.silva@gmail.com"
 * Output: "j***a@gmail.com"
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return '***@***'
    if (local.length <= 2) return `${local[0]}***@${domain}`
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}${local[local.length - 1]}@${domain}`
}

/**
 * Mask a CRECI number.
 * Input: "12345-F"
 * Output: "***45-F"
 */
export function maskCreci(creci: string): string {
    if (creci.length <= 3) return '***'
    return `***${creci.slice(-3)}`
}

/**
 * Format a CPF for display (unmasked).
 * Input: "12345678900"
 * Output: "123.456.789-00"
 */
export function formatCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function calculateCpfCheckDigit(baseDigits: string, weightStart: number): number {
    let sum = 0
    for (let i = 0; i < baseDigits.length; i += 1) {
        sum += Number(baseDigits[i]) * (weightStart - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
}

/**
 * Validate a CPF using the official check-digit formula.
 * Accepts formatted or unformatted input.
 */
export function isValidCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) return false
    if (/^(\d)\1{10}$/.test(digits)) return false

    const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9), 10)
    if (firstCheckDigit !== Number(digits[9])) return false

    const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10), 11)
    return secondCheckDigit === Number(digits[10])
}

/**
 * Format a phone number for display.
 * Input: "11987654321"
 * Output: "(11) 98765-4321"
 */
export function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
