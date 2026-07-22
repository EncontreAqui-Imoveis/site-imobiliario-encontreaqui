import { Notification } from '@/lib/api/notifications'
import { buildPublicPropertyUrl } from '@/lib/propertyLinks'

const SAFE_ENTITY_ID = /^[A-Za-z0-9_-]{1,128}$/

function toStringOrNull(value: unknown): string | null {
    const normalized = String(value ?? '').trim()
    return normalized.length > 0 ? normalized : null
}

function safeEntityId(value: unknown): string | null {
    const normalized = toStringOrNull(value)
    return normalized && SAFE_ENTITY_ID.test(normalized) ? normalized : null
}

function getMetadataId(metadata: Record<string, unknown>, snakeCaseKey: string, camelCaseKey: string): string | null {
    return safeEntityId(metadata[snakeCaseKey]) ?? safeEntityId(metadata[camelCaseKey])
}

function resolveCanonicalRoute(metadata: Record<string, unknown>): string | null {
    const route = toStringOrNull(metadata.route)
    if (!route || !route.startsWith('/') || route.includes('?') || route.includes('#')) return null

    const segments = route.split('/').filter(Boolean)
    if (segments.length === 1 && segments[0] === 'contracts') return '/meus-processos/contratos'
    if (segments.length === 1 && segments[0] === 'proposals') return '/meus-processos/propostas'

    const [resource, entityId] = segments
    if (segments.length !== 2 || !entityId || !SAFE_ENTITY_ID.test(entityId)) return null

    if (resource === 'contracts') {
        return `/meus-processos/contratos/${encodeURIComponent(entityId)}`
    }
    if (resource === 'proposals') {
        return `/meus-processos/propostas/${encodeURIComponent(entityId)}/upload-assinada`
    }
    if (resource === 'properties') {
        const propertyId = Number(entityId)
        if (!Number.isSafeInteger(propertyId) || propertyId <= 0) return '/imoveis'
        const publicReference =
            toStringOrNull(metadata.public_code) ??
            toStringOrNull(metadata.publicCode) ??
            toStringOrNull(metadata.publicCodeSlug) ??
            toStringOrNull(metadata.slug)
        return buildPublicPropertyUrl({ id: propertyId, slug: publicReference ?? undefined, public_code: undefined })
    }

    return null
}

/**
 * Converts only the backend's constrained notification metadata into an internal route.
 * It intentionally ignores arbitrary URLs and unrelated metadata fields.
 */
export function resolveNotificationHref(notification: Notification): string | null {
    const metadata = notification.metadataJson ?? {}
    const canonicalRoute = resolveCanonicalRoute(metadata)
    if (canonicalRoute) return canonicalRoute

    const contractId = getMetadataId(metadata, 'contract_id', 'contractId')
    if (contractId) {
        return `/meus-processos/contratos/${encodeURIComponent(contractId)}`
    }

    const negotiationId = getMetadataId(metadata, 'negotiation_id', 'negotiationId')
    if (negotiationId) {
        return `/meus-processos/propostas/${encodeURIComponent(negotiationId)}/upload-assinada`
    }

    if (notification.relatedEntityType === 'negotiation') return '/meus-processos/propostas'

    if (notification.relatedEntityType === 'property' && notification.relatedEntityId) {
        const propertyPublicRef =
            toStringOrNull(metadata.publicCode) ??
            toStringOrNull(metadata.public_code) ??
            toStringOrNull(metadata.publicCodeSlug) ??
            toStringOrNull(metadata.slug)
        return buildPublicPropertyUrl({
            id: notification.relatedEntityId,
            slug: propertyPublicRef ?? undefined,
            public_code: undefined,
        })
    }

    if (notification.relatedEntityType === 'broker' || notification.relatedEntityType === 'user') return '/perfil'
    if (notification.relatedEntityType === 'announcement') return '/anuncie'

    return null
}
