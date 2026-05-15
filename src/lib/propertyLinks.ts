import { Property } from '@/types/property'

type PublicCodeSource = Pick<Property, 'slug' | 'public_code' | 'id'>

function toText(value: unknown): string {
    if (value === null || value === undefined) return ''
    const normalized =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean'
            ? String(value).trim()
            : ''
    return normalized.length > 0 ? normalized : ''
}

export function getPublicPropertySlug(property: PublicCodeSource): string {
    const slug = toText(property.slug)
    if (slug) return slug

    const publicCode = toText(property.public_code)
    if (publicCode) return publicCode

    return ''
}

export function buildPublicPropertyUrl(property: PublicCodeSource): string {
    const slug = getPublicPropertySlug(property)
    if (slug) return `/imoveis/${encodeURIComponent(slug)}`
    const fallbackId = toText(property.id)
    return fallbackId ? `/imoveis/${encodeURIComponent(fallbackId)}` : '/imoveis'
}

