import { Property } from '@/types/property'
import { reportObservedError } from '@/lib/observability'
import { apiClient, API_BASE_URL, ApiError } from '@/lib/api/client'
import { hasAuthTokenInBrowser, hasAuthTokenInServer } from '@/lib/auth/tokenStore'
import { normalizeAreaUnidade } from '@/lib/areaUnits'

type ErrorPayload = {
    message?: string
    error?: string
    requestId?: string
    request_id?: string
}

type CloudinaryImagePreset = 'thumb' | 'detail' | 'hero'

const CLOUDINARY_IMAGE_PRESETS: Record<CloudinaryImagePreset, string> = {
    thumb: 'c_limit,w_480,q_auto,f_auto',
    detail: 'c_limit,w_1200,q_auto,f_auto',
    hero: 'c_limit,w_1600,q_auto,f_auto',
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

function normalizeCloudinaryUrl(value: string, preset: CloudinaryImagePreset = 'hero'): string {
    const normalized = value.trim()
    if (!normalized) return ''

    try {
        const url = new URL(normalized)
        if (url.hostname === 'res.cloudinary.co') {
            url.hostname = 'res.cloudinary.com'
        }
        if (url.hostname === 'res.cloudinary.com') {
            if (url.pathname === '/' && !url.search && !url.hash) {
                return ''
            }

            const segments = url.pathname.split('/').filter(Boolean)
            const uploadIndex = segments.findIndex((segment, index) => {
                const isResourceType = ['image', 'video', 'raw'].includes(segment)
                return isResourceType && segments[index + 1] === 'upload'
            })

            if (uploadIndex >= 0) {
                const afterUpload = segments.slice(uploadIndex + 2)
                const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/i.test(segment))
                const publicIdSegments = versionIndex >= 0 ? afterUpload.slice(versionIndex) : afterUpload
                const presetTransformations = CLOUDINARY_IMAGE_PRESETS[preset].split(',')
                const optimizedSegments = [
                    ...segments.slice(0, uploadIndex + 2),
                    ...presetTransformations,
                    ...publicIdSegments,
                ]
                url.pathname = `/${optimizedSegments.join('/')}`
            }

            return url.toString()
        }
        return normalized
    } catch {
        return normalized.startsWith('https://res.cloudinary.co/')
            ? normalized.replace('https://res.cloudinary.co/', 'https://res.cloudinary.com/')
            : normalized
    }
}

function resolveImagePreset(preset?: CloudinaryImagePreset): CloudinaryImagePreset {
    return preset ?? 'hero'
}

function normalizeAreaField(raw: unknown): Property['areaConstruidaUnidade'] {
    if (raw == null) return 'm2'
    return normalizeAreaUnidade(String(raw))
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

function toImageUrlList(raw: unknown, preset: CloudinaryImagePreset): string[] {
    if (!raw) return []

    if (Array.isArray(raw)) {
        return raw
            .map((item) => {
                if (typeof item === 'string') return normalizeCloudinaryUrl(item.trim(), preset)
                if (item && typeof item === 'object') {
                    const candidate = (item as Record<string, unknown>).image_url ?? (item as Record<string, unknown>).url
                    return candidate ? normalizeCloudinaryUrl(String(candidate).trim(), preset) : ''
                }
                return ''
            })
            .filter(Boolean)
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((entry) => normalizeCloudinaryUrl(entry.trim(), preset))
            .filter(Boolean)
    }

    return []
}

const SECURITY_CAMERA_AMENITY_CANONICAL = 'SISTEMA DE SEGURANÇA/CÂMERA'
const SECURITY_CAMERA_AMENITY_NORMALIZED = SECURITY_CAMERA_AMENITY_CANONICAL
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
const SECURITY_CAMERA_AMENITY_LEGACY_NORMALIZED = 'SISTEMA DE SEGURANÇA/CÂMARA'
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

function normalizeAmenityLabel(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return ''

    const normalized = trimmed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()

    if (
        normalized === SECURITY_CAMERA_AMENITY_NORMALIZED
        || normalized === SECURITY_CAMERA_AMENITY_LEGACY_NORMALIZED
    ) {
        return SECURITY_CAMERA_AMENITY_CANONICAL
    }

    return trimmed
}

function normalizeAmenities(raw: unknown): string[] {
    if (!Array.isArray(raw)) return []
    const normalized = new Set<string>()
    for (const item of raw) {
        const value = typeof item === 'string'
            ? normalizeAmenityLabel(item)
            : normalizeAmenityLabel(String(item))
        if (value) {
            normalized.add(value)
        }
    }
    return [...normalized]
}

function normalizeStatus(rawStatus: unknown): Property['status'] {
    const normalized = String(rawStatus ?? 'approved').trim().toLowerCase()
    if (normalized === 'approved') return 'approved'
    if (normalized === 'sold') return 'sold'
    if (normalized === 'rented') return 'rented'
    if (normalized === 'rejected') return 'rejected'
    return 'pending_approval'
}

export function buildPublicPropertyRouteKey(raw: unknown): string | undefined {
    if (raw == null) return undefined
    const normalized = String(raw).trim()
    return normalized.length > 0 ? normalized : undefined
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

export function normalizeProperty(
    raw: unknown,
    options?: { imagePreset?: CloudinaryImagePreset },
): Property | null {
    if (!raw || typeof raw !== 'object') return null

    const item = raw as Record<string, unknown>
    const imagePreset = resolveImagePreset(options?.imagePreset)
    const id = toNumber(item.id)
    if (!id) return null

    const createdAt =
        toStringOrUndefined(item.createdAt) ??
        toStringOrUndefined(item.created_at) ??
        new Date().toISOString()

    const areaConstruidaUnidade = normalizeAreaField(
        item.areaConstruidaUnidade ??
            item.area_construida_unidade ??
            item.areaTerrenoUnidade ??
            item.area_terreno_unidade,
    )
    const areaTerrenoUnidade = normalizeAreaField(
        item.areaTerrenoUnidade ??
            item.area_terreno_unidade ??
            item.areaConstruidaUnidade ??
            item.area_construida_unidade,
    )
    const areaConstruidaM2 = toNumber(item.area_construida_m2 ?? item.areaConstruida ?? item.area_construida)
    const areaTerrenoM2 = toNumber(item.area_terreno_m2 ?? item.areaTerreno ?? item.area_terreno)
    const areaConstruidaValor = toNumber(item.area_construida_valor ?? item.areaConstruidaValor)
    const areaTerrenoValor = toNumber(item.area_terreno_valor ?? item.areaTerrenoValor)
    const promotionPrice = toNumber(
        item.promotionPrice ??
            item.promotion_price ??
            item.promo_price ??
            item.promo_price_sale
    )
    const promotionalRentPrice = toNumber(
        item.promotionalRentPrice ??
            item.promotional_rent_price ??
            item.promo_rent_price
    )
    const promotionStart =
        toStringOrUndefined(item.promotionStart) ??
        toStringOrUndefined(item.promotion_start)
    const promotionEnd =
        toStringOrUndefined(item.promotionEnd) ??
        toStringOrUndefined(item.promotion_end)

    const imagesFromImages = toImageUrlList(item.images, imagePreset)
    const imagesFromPropertyImages = toImageUrlList(item.property_images, imagePreset)
    const imagesFromImageUrls = toImageUrlList(item.image_urls, imagePreset)
    const images =
        imagesFromImages.length > 0
            ? imagesFromImages
            : imagesFromPropertyImages.length > 0
                ? imagesFromPropertyImages
                : imagesFromImageUrls
    const negotiation = normalizeNegotiation(item)
    const amenities = normalizeAmenities(item.amenities)
    const hasLegacyMobiliadaField = toBoolean(item.ehMobiliada ?? item.eh_mobiliada) ?? false
    const ehMobiliada = hasLegacyMobiliadaField || amenities.includes('MOBILIADA')

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
        areaConstruida: areaConstruidaM2 ?? areaConstruidaValor,
        areaConstruidaUnidade,
        areaConstruidaValor,
        semQuadra: toBoolean(item.semQuadra ?? item.sem_quadra) ?? false,
        semLote: toBoolean(item.semLote ?? item.sem_lote) ?? false,
        areaTerreno: areaTerrenoM2 ?? areaTerrenoValor,
        areaTerrenoUnidade: areaTerrenoUnidade,
        areaTerrenoValor,
        garageSpots: toNumber(item.garageSpots ?? item.garage_spots),
        suites: toNumber(item.suites),
        hasWifi: toBoolean(item.hasWifi ?? item.has_wifi),
        temPiscina: toBoolean(item.temPiscina ?? item.tem_piscina),
        temEnergiaSolar: toBoolean(item.temEnergiaSolar ?? item.tem_energia_solar),
        temAutomacao: toBoolean(item.temAutomacao ?? item.tem_automacao),
        temArCondicionado: toBoolean(item.temArCondicionado ?? item.tem_ar_condicionado),
        amenities,
        ehMobiliada,
        valorCondominio: toNumber(item.valorCondominio ?? item.valor_condominio),
        valorIptu: toNumber(item.valorIptu ?? item.valor_iptu),
        images: images.length > 0 ? images : ['/logo_circular.png'],
        videoUrl: toStringOrUndefined(item.videoUrl ?? item.video_url),
        brokerId: toNumber(item.brokerId ?? item.broker_id),
        ownerId: toNumber(item.ownerId ?? item.owner_id),
        brokerName: toStringOrUndefined(item.brokerName ?? item.broker_name),
        brokerPhone: toStringOrUndefined(item.brokerPhone ?? item.broker_phone),
        brokerEmail: toStringOrUndefined(item.brokerEmail ?? item.broker_email),
        promotionPrice,
        promotionalRentPrice,
        promotionStart,
        promotionEnd,
        hasPendingEditRequest:
            toBoolean(item.hasPendingEditRequest ?? item.has_pending_edit_request) ?? false,
        pendingEditRequestId: toNumber(
            item.pendingEditRequestId ?? item.pending_edit_request_id,
        ),
        createdAt,
        code: toStringOrUndefined(item.code),
        public_code: buildPublicPropertyRouteKey(item.public_code) ?? buildPublicPropertyRouteKey(item.publicCode),
        slug: buildPublicPropertyRouteKey(item.slug) ?? buildPublicPropertyRouteKey(item.public_slug),
        latitude: toNumber(item.latitude),
        longitude: toNumber(item.longitude),
        numero: toStringOrUndefined(item.numero),
        quadra: toStringOrUndefined(item.quadra),
        lote: toStringOrUndefined(item.lote),
        complemento: toStringOrUndefined(item.complemento),
        semCep: toBoolean(item.semCep ?? item.sem_cep) ?? false,
        negotiationId: negotiation?.id,
        negotiation,
        latestContractId: toStringOrUndefined(item.latestContractId ?? item.latest_contract_id),
        latestContractStatus: toStringOrUndefined(item.latestContractStatus ?? item.latest_contract_status),
        rejectionReason: toStringOrUndefined(
            item.rejectionReason ?? item.rejection_reason,
        ) ?? null,
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
    } else {
        try {
          const text = (await response.text()).trim()
          if (text.length > 0) {
            message = text
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
            .map((item) => normalizeProperty(item, { imagePreset: 'thumb' }))
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

type HomeDeal = 'sale' | 'rent'

/**
 * Destaques administrativos (vitrine) — alinhado ao app: `GET /properties/featured?scope=`.
 */
export async function fetchFeaturedProperties(limit = 6, deal: HomeDeal = 'sale'): Promise<Property[]> {
    const scope = deal === 'rent' ? 'rent' : 'sale'
    try {
        const response = await fetch(
            `${API_BASE_URL}/properties/featured?limit=${encodeURIComponent(String(limit))}&page=1&scope=${scope}`,
            { next: { revalidate: 60 } }
        )
        if (!response.ok) {
            await logFailedResponse('Error fetching featured properties:', response)
            return []
        }
        const payload = (await response.json()) as unknown
        return unwrapPropertyArray(payload)
            .map((item) => normalizeProperty(item, { imagePreset: 'thumb' }))
            .filter((item): item is Property => item !== null)
            .slice(0, limit)
    } catch (error) {
        console.error('Error fetching featured properties', error)
        reportObservedError(error, { module: 'properties-api', message: 'Error fetching featured properties' })
        return []
    }
}

export async function fetchRecentProperties(limit = 8, deal: HomeDeal = 'sale'): Promise<Property[]> {
    return fetchHomePropertiesBySort(limit, deal, 'created_at:desc')
}

async function fetchHomePropertiesBySort(
    limit: number,
    deal: HomeDeal,
    sort: 'created_at:desc' | 'price:desc' | 'price:asc',
): Promise<Property[]> {
    const params = new URLSearchParams()
    params.set('status', 'approved')
    params.set('limit', String(limit))
    params.set('sort', sort)
    params.set('purpose', deal === 'rent' ? 'Aluguel' : 'Venda')

    const properties = await fetchProperties(params)
    return properties.slice(0, limit)
}

export async function fetchMostExpensiveProperties(limit = 8, deal: HomeDeal = 'sale'): Promise<Property[]> {
    return fetchHomePropertiesBySort(limit, deal, 'price:desc')
}

export async function fetchMostAffordableProperties(limit = 8, deal: HomeDeal = 'sale'): Promise<Property[]> {
    return fetchHomePropertiesBySort(limit, deal, 'price:asc')
}

async function fetchPrivatePropertyByIdentifier(normalizedId: string): Promise<Property | null> {
    const candidatePaths = [`/properties/${normalizedId}`, `/properties/code/${normalizedId}`] as const
    for (let index = 0; index < candidatePaths.length; index += 1) {
        const path = candidatePaths[index]
        try {
            const privatePayload = await apiClient.get<unknown>(path)
            return normalizeProperty(privatePayload, { imagePreset: 'detail' })
        } catch (error) {
            if (
                error instanceof ApiError &&
                (error.status === 404 || error.status === 403 || error.status === 401)
            ) {
                if (index < candidatePaths.length - 1) {
                    continue
                }
                return null
            }
            throw error
        }
    }
    return null
}

export async function fetchPropertyById(id: string | number): Promise<Property | null> {
    const normalizedId = encodeURIComponent(String(id))
    try {
        const response = await fetch(`${API_BASE_URL}/public/properties/${normalizedId}`, {
            cache: 'no-store',
        })
        const hasSessionToken =
            typeof window !== 'undefined'
                ? hasAuthTokenInBrowser()
                : await hasAuthTokenInServer()

        if (!response.ok) {
            await logFailedResponse('Error fetching property details:', response)
            if (!hasSessionToken) {
                return null
            }
            return await fetchPrivatePropertyByIdentifier(normalizedId)
        }

        const payload = await response.json()
        const raw = payload?.data ?? payload
        const publicProperty = normalizeProperty(raw, { imagePreset: 'detail' })
        if (publicProperty) {
            return publicProperty
        }

        if (!hasSessionToken) {
            return null
        }
        return await fetchPrivatePropertyByIdentifier(normalizedId)
    } catch (error) {
        console.error('Error fetching property details:', error)
        reportObservedError(error, {
            module: 'properties-api',
            message: 'Error fetching property details',
        })
        return null
    }
}

export async function fetchSimilarProperties(property: Property): Promise<Property[]> {
    const collected: Property[] = []
    const seenIds = new Set<number>([property.id])

    async function tryFetch(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { cache: 'no-store' })
            if (!response.ok) {
                console.warn('[fetchSimilarProperties] Response not ok:', url, response.status)
                return false
            }
            const payload = await response.json()
            // Handle all backend response shapes: { properties: [] }, { data: [] }, or raw []
            const rows: unknown[] = Array.isArray(payload?.properties)
                ? payload.properties
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : []

            if (rows.length === 0) {
                console.warn('[fetchSimilarProperties] Empty list from:', url)
                return false
            }

            const normalized = rows
                .map((item) => normalizeProperty(item, { imagePreset: 'thumb' }))
                .filter((item): item is Property => item !== null)

            for (const p of normalized) {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id)
                    collected.push(p)
                }
            }
            return true
        } catch (e) {
            console.warn('[fetchSimilarProperties] Fetch error for:', url, e)
            return false
        }
    }

    console.log('[fetchSimilarProperties] Starting for property:', property.id, {
        bairro: property.bairro,
        city: property.city,
        type: property.type,
        API_BASE_URL,
    })

    // 1. Try Bairro
    if (property.bairro?.trim()) {
        await tryFetch(
            `${API_BASE_URL}/properties?bairro=${encodeURIComponent(property.bairro)}&limit=10&status=approved`
        )
    }

    // 2. Fallback: City
    if (collected.length < 3 && property.city?.trim()) {
        await tryFetch(
            `${API_BASE_URL}/properties?city=${encodeURIComponent(property.city)}&limit=10&status=approved`
        )
    }

    // 3. Fallback: Type
    if (collected.length < 3 && property.type?.trim()) {
        await tryFetch(
            `${API_BASE_URL}/properties?type=${encodeURIComponent(property.type)}&limit=10&status=approved`
        )
    }

    // 4. Fallback: Most recent
    if (collected.length < 3) {
        await tryFetch(
            `${API_BASE_URL}/properties?limit=10&status=approved`
        )
    }

    const result = collected.slice(0, 3)
    console.log('[fetchSimilarProperties] Result:', result.length, 'properties')
    return result
}
