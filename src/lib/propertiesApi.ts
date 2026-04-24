import { Property } from '@/types/property'
import { reportObservedError } from '@/lib/observability'
import { apiClient, API_BASE_URL, ApiError } from '@/lib/api/client'
import { hasAuthTokenInBrowser, hasAuthTokenInServer } from '@/lib/auth/tokenStore'

type ErrorPayload = {
    message?: string
    error?: string
    requestId?: string
    request_id?: string
}

function toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function toStringOrUndefined(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined
    const normalized = String(value).trim()
    return normalized.length > 0 ? normalized : undefined
}

function toBoolean(value: unknown): boolean | undefined {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    const normalized = String(value).trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true
    if (normalized === '0' || normalized === 'false' || normalized === 'no') return false
    return undefined
}

function toImageUrlList(raw: unknown): string[] {
    if (!raw) return []

    if (Array.isArray(raw)) {
        return raw
            .map((item) => {
                if (typeof item === 'string') return item.trim()
                if (item && typeof item === 'object') {
                    const candidate = (item as Record<string, unknown>).image_url ?? (item as Record<string, unknown>).url
                    return candidate ? String(candidate).trim() : ''
                }
                return ''
            })
            .filter(Boolean)
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
    }

    return []
}

function normalizeStatus(rawStatus: unknown): Property['status'] {
    const normalized = String(rawStatus ?? 'approved').trim().toLowerCase()
    if (normalized === 'approved') return 'approved'
    if (normalized === 'sold') return 'sold'
    if (normalized === 'rented') return 'rented'
    if (normalized === 'rejected') return 'rejected'
    return 'pending_approval'
}

function normalizeType(rawType: unknown): Property['type'] {
    const normalized = String(rawType ?? 'Casa').trim()
    return normalized.length > 0 ? normalized : 'Casa'
}

function normalizePurpose(rawPurpose: unknown): Property['purpose'] {
    const normalized = String(rawPurpose ?? 'Venda').trim()
    if (normalized === 'Venda' || normalized === 'Aluguel' || normalized === 'Venda e Aluguel') {
        return normalized
    }
    return 'Venda'
}

function normalizeNegotiation(raw: Record<string, unknown>): Property['negotiation'] {
    const negotiationSource =
        raw.negotiation && typeof raw.negotiation === 'object'
            ? (raw.negotiation as Record<string, unknown>)
            : null

    const id = toStringOrUndefined(
        negotiationSource?.id ??
            raw.negotiationId ??
            raw.negotiation_id ??
            raw.activeNegotiationId ??
            raw.active_negotiation_id,
    )

    if (!id) return undefined

    return {
        id,
        status: toStringOrUndefined(
            negotiationSource?.status ??
                raw.activeNegotiationStatus ??
                raw.active_negotiation_status,
        ),
        clientName: toStringOrUndefined(
            negotiationSource?.clientName ??
                negotiationSource?.client_name ??
                raw.activeNegotiationClientName ??
                raw.active_negotiation_client_name,
        ),
        value: toNumber(
            negotiationSource?.value ??
                raw.activeNegotiationValue ??
                raw.active_negotiation_value,
        ),
    }
}

export function normalizeProperty(raw: unknown): Property | null {
    if (!raw || typeof raw !== 'object') return null

    const item = raw as Record<string, unknown>
    const id = toNumber(item.id)
    if (!id) return null

    const createdAt =
        toStringOrUndefined(item.createdAt) ??
        toStringOrUndefined(item.created_at) ??
        new Date().toISOString()

    const imagesFromImages = toImageUrlList(item.images)
    const imagesFromPropertyImages = toImageUrlList(item.property_images)
    const imagesFromImageUrls = toImageUrlList(item.image_urls)
    const images =
        imagesFromImages.length > 0
            ? imagesFromImages
            : imagesFromPropertyImages.length > 0
                ? imagesFromPropertyImages
                : imagesFromImageUrls
    const negotiation = normalizeNegotiation(item)

    return {
        id,
        title: toStringOrUndefined(item.title) ?? `Imóvel #${id}`,
        description: toStringOrUndefined(item.description) ?? '',
        type: normalizeType(item.type),
        status: normalizeStatus(item.status),
        purpose: normalizePurpose(item.purpose),
        price: toNumber(item.price) ?? 0,
        priceSale: toNumber(item.priceSale ?? item.price_sale ?? item.sale_value),
        priceRent: toNumber(item.priceRent ?? item.price_rent),
        address: toStringOrUndefined(item.address) ?? '',
        city: toStringOrUndefined(item.city) ?? '',
        state: toStringOrUndefined(item.state) ?? '',
        bairro: toStringOrUndefined(item.bairro),
        cep: toStringOrUndefined(item.cep),
        bedrooms: toNumber(item.bedrooms ?? item.quartos),
        bathrooms: toNumber(item.bathrooms ?? item.banheiros),
        areaConstruida: toNumber(item.areaConstruida ?? item.area_construida),
        areaConstruidaUnidade: (() => {
            const raw = item.areaConstruidaUnidade ?? item.area_construida_unidade
            const s = String(raw ?? 'm2').trim().toLowerCase()
            if (s === 'hectare' || s === 'ha') return 'hectare' as const
            if (s === 'alqueire' || s === 'alq') return 'alqueire' as const
            return 'm2' as const
        })(),
        semQuadra: toBoolean(item.semQuadra ?? item.sem_quadra) ?? false,
        semLote: toBoolean(item.semLote ?? item.sem_lote) ?? false,
        areaTerreno: toNumber(item.areaTerreno ?? item.area_terreno),
        areaTerrenoUnidade: (() => {
            const raw = item.areaTerrenoUnidade ?? item.area_terreno_unidade
            const s = String(raw ?? 'm2').trim().toLowerCase()
            if (s === 'hectare' || s === 'ha') return 'hectare' as const
            if (s === 'alqueire' || s === 'alq') return 'alqueire' as const
            return 'm2' as const
        })(),
        garageSpots: toNumber(item.garageSpots ?? item.garage_spots),
        hasWifi: toBoolean(item.hasWifi ?? item.has_wifi),
        temPiscina: toBoolean(item.temPiscina ?? item.tem_piscina),
        temEnergiaSolar: toBoolean(item.temEnergiaSolar ?? item.tem_energia_solar),
        temAutomacao: toBoolean(item.temAutomacao ?? item.tem_automacao),
        temArCondicionado: toBoolean(item.temArCondicionado ?? item.tem_ar_condicionado),
        ehMobiliada: toBoolean(item.ehMobiliada ?? item.eh_mobiliada),
        valorCondominio: toNumber(item.valorCondominio ?? item.valor_condominio),
        valorIptu: toNumber(item.valorIptu ?? item.valor_iptu),
        images: images.length > 0 ? images : ['/logo_circular.png'],
        videoUrl: toStringOrUndefined(item.videoUrl ?? item.video_url),
        brokerId: toNumber(item.brokerId ?? item.broker_id),
        ownerId: toNumber(item.ownerId ?? item.owner_id),
        brokerName: toStringOrUndefined(item.brokerName ?? item.broker_name),
        brokerPhone: toStringOrUndefined(item.brokerPhone ?? item.broker_phone),
        brokerEmail: toStringOrUndefined(item.brokerEmail ?? item.broker_email),
        hasPendingEditRequest:
            toBoolean(item.hasPendingEditRequest ?? item.has_pending_edit_request) ?? false,
        pendingEditRequestId: toNumber(
            item.pendingEditRequestId ?? item.pending_edit_request_id,
        ),
        createdAt,
        code: toStringOrUndefined(item.code),
        latitude: toNumber(item.latitude),
        longitude: toNumber(item.longitude),
        numero: toStringOrUndefined(item.numero),
        quadra: toStringOrUndefined(item.quadra),
        lote: toStringOrUndefined(item.lote),
        complemento: toStringOrUndefined(item.complemento),
        semCep: toBoolean(item.semCep ?? item.sem_cep) ?? false,
        negotiationId: negotiation?.id,
        negotiation,
    }
}

function unwrapPropertyArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object') {
        const obj = payload as Record<string, unknown>
        if (Array.isArray(obj.data)) return obj.data
        if (Array.isArray(obj.properties)) return obj.properties
    }
    return []
}

async function logFailedResponse(context: string, response: Response): Promise<void> {
    const requestId = response.headers.get('x-request-id') || undefined
    let message: string | undefined
    let payloadRequestId: string | undefined

    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
        try {
            const payload = (await response.json()) as ErrorPayload
            if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
                message = payload.message.trim()
            } else if (typeof payload?.error === 'string' && payload.error.trim().length > 0) {
                message = payload.error.trim()
            }
            if (typeof payload?.requestId === 'string' && payload.requestId.trim().length > 0) {
                payloadRequestId = payload.requestId.trim()
            } else if (typeof payload?.request_id === 'string' && payload.request_id.trim().length > 0) {
                payloadRequestId = payload.request_id.trim()
            }
        } catch {
            message = undefined
        }
    }

    console.error(context, {
        status: response.status,
        requestId: requestId || payloadRequestId,
        message,
    })
    reportObservedError(new Error(context), {
        module: 'properties-api',
        status: response.status,
        requestId: requestId || payloadRequestId,
        message,
        url: response.url || undefined,
    })
}

async function fetchProperties(params: URLSearchParams): Promise<Property[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/properties?${params.toString()}`, {
            next: { revalidate: 60 },
        })

        if (!response.ok) {
            await logFailedResponse('Error fetching properties list:', response)
            return []
        }

        const payload = await response.json()
        return unwrapPropertyArray(payload)
            .map((item) => normalizeProperty(item))
            .filter((item): item is Property => item !== null)
    } catch (error) {
        console.error('Error fetching properties list:', error)
        reportObservedError(error, {
            module: 'properties-api',
            message: 'Error fetching properties list',
        })
        return []
    }
}

export async function fetchFeaturedProperties(limit = 6): Promise<Property[]> {
    const params = new URLSearchParams()
    params.set('featured', '1')
    params.set('status', 'approved')
    params.set('limit', String(limit))
    params.set('sort', 'created_at:desc')

    const properties = await fetchProperties(params)
    return properties.slice(0, limit)
}

export async function fetchRecentProperties(limit = 8): Promise<Property[]> {
    const params = new URLSearchParams()
    params.set('status', 'approved')
    params.set('limit', String(limit))
    params.set('sort', 'created_at:desc')

    const properties = await fetchProperties(params)
    return properties.slice(0, limit)
}

export async function fetchPropertyById(id: string | number): Promise<Property | null> {
    const normalizedId = encodeURIComponent(String(id))
    try {
        const response = await fetch(`${API_BASE_URL}/public/properties/${normalizedId}`, {
            cache: 'no-store',
        })

        if (!response.ok) {
            await logFailedResponse('Error fetching property details:', response)
            const hasSessionToken =
                typeof window !== 'undefined'
                    ? hasAuthTokenInBrowser()
                    : await hasAuthTokenInServer()
            if (!hasSessionToken) {
                return null
            }
            try {
                const privatePayload = await apiClient.get<unknown>(`/properties/${normalizedId}`)
                return normalizeProperty(privatePayload)
            } catch (error) {
                if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
                    return null
                }
                throw error
            }
        }

        const payload = await response.json()
        const raw = payload?.data ?? payload
        return normalizeProperty(raw)
    } catch (error) {
        console.error('Error fetching property details:', error)
        reportObservedError(error, {
            module: 'properties-api',
            message: 'Error fetching property details',
        })
        return null
    }
}
