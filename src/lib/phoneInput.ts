export function formatPhoneInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 13)
    if (!digits) return ''
    if (digits.length <= 2) return `+${digits}`

    const country = digits.slice(0, 2)
    const rest = digits.slice(2)

    if (rest.length <= 2) return `+${country} (${rest}`
    const area = rest.slice(0, 2)
    const local = rest.slice(2)

    if (!local) return `+${country} (${area})`
    if (local.length <= 5) return `+${country} (${area}) ${local}`
    return `+${country} (${area}) ${local.slice(0, 5)}-${local.slice(5)}`
}

export function normalizePhoneDigits(value: string): string {
    return value.replace(/\D/g, '')
}
