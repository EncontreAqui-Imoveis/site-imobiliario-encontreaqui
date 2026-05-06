export function normalizePhoneForBrazilLinks(rawPhone: string | null | undefined): string | null {
    const digits = String(rawPhone ?? '').replace(/\D/g, '')
    if (!digits) return null
    return digits.startsWith('55') ? digits : `55${digits}`
}

const TEAM_CONTACT_PHONE_PLACEHOLDER = '5511999999999'
const TEAM_CONTACT_PHONE_FALLBACK = '5564992732027'
const TEAM_CONTACT_PHONE_ENV_VARS = [
    'NEXT_PUBLIC_TEAM_CONTACT_WHATSAPP_PHONE',
    'NEXT_PUBLIC_TEAM_CONTACT_PHONE',
    'NEXT_PUBLIC_SUPPORT_PHONE',
]

function readTeamContactPhoneFromEnv(): string | null {
    return (
        TEAM_CONTACT_PHONE_ENV_VARS.map((envName) => process.env[envName])
            .filter((value): value is string => Boolean(value))
            .find((value) => value.trim().length > 0) ?? null
    )
}

function isBlockedTeamContactPhone(phone: string): boolean {
    return phone === TEAM_CONTACT_PHONE_PLACEHOLDER
}

export function resolveTeamContactPhone(rawPhone: string | null | undefined = null): string {
    const configuredPhone =
        rawPhone ?? readTeamContactPhoneFromEnv()
    const normalized = normalizePhoneForBrazilLinks(configuredPhone)
    if (!normalized || isBlockedTeamContactPhone(normalized)) {
        return TEAM_CONTACT_PHONE_FALLBACK
    }
    return normalized
}

export function buildTeamContactChannelUrl(rawPhone?: string | null): string {
    return `https://wa.me/${resolveTeamContactPhone(rawPhone)}`
}

export const TEAM_CONTACT_PHONE = resolveTeamContactPhone()
export const TEAM_CONTACT_CHANNEL_URL = buildTeamContactChannelUrl()

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
