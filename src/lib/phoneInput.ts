function normalizePhoneLocalDigits(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('55') && digits.length > 11) {
        return digits.slice(2, 13)
    }
    return digits.slice(0, 11)
}

export function formatPhoneInput(value: string): string {
    const digits = normalizePhoneLocalDigits(value)
    if (!digits) return ''
    if (digits.length <= 2) return `(${digits}`
    const area = digits.slice(0, 2)
    const local = digits.slice(2)
    if (!local) return `(${area}) `
    if (local.length <= 5) return `(${area}) ${local}`
    return `(${area}) ${local.slice(0, 5)}-${local.slice(5)}`
}

export function normalizePhoneDigits(value: string): string {
    const local = normalizePhoneLocalDigits(value)
    if (!local) return ''
    return `55${local}`
}

export { normalizePhoneLocalDigits }
