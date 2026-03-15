export function normalizePhoneForBrazilLinks(rawPhone: string | null | undefined): string | null {
    const digits = String(rawPhone ?? '').replace(/\D/g, '')
    if (!digits) return null
    return digits.startsWith('55') ? digits : `55${digits}`
}

export function buildWhatsappLink(phone: string | null | undefined, message: string): string | null {
    const normalized = normalizePhoneForBrazilLinks(phone)
    if (!normalized) return null
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function buildPhoneLink(phone: string | null | undefined): string | null {
    const normalized = normalizePhoneForBrazilLinks(phone)
    if (!normalized) return null
    return `tel:+${normalized}`
}
