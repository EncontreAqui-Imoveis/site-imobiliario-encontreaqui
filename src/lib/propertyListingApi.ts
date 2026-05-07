import { API_BASE_URL } from '@/lib/api/client'
import { areaInputToSquareMeters, normalizeAreaUnidade } from '@/lib/areaUnits'
import { normalizeProperty } from '@/lib/propertiesApi'
import type { Property } from '@/types/property'

export interface PropertyListingPageResult {
    properties: Property[]
    total: number
    page: number
    totalPages: number
}

const DEFAULT_LIMIT = 10
const AMENITY_QUERY_KEYS: Record<string, string> = {
    amenity_poco_artesiano: 'POÇO ARTESIANO',
    amenity_elevador: 'ELEVADOR',
    amenity_academia: 'ACADEMIA',
    amenity_churrasqueira: 'CHURRASQUEIRA',
    amenity_salao_festas: 'SALÃO DE FESTAS',
    amenity_quadra: 'QUADRA',
    amenity_condominio_fechado: 'CONDOMÍNIO FECHADO',
    amenity_aceita_pets: 'ACEITA PETS',
    amenity_mobiliada: 'MOBILIADA',
    amenity_sistema_seguranca_camera: 'SISTEMA DE SEGURANÇA/CÂMERA',
    amenity_sauna: 'SAUNA',
}

function parsePositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return Math.floor(parsed)
}

function setIfPresent(target: URLSearchParams, key: string, value: string | null): void {
    if (!value) return
    const normalized = value.trim()
    if (!normalized) return
    target.set(key, normalized)
}

export function buildPublicPropertiesQuery(
    sourceParams: URLSearchParams,
    page: number,
    limit = DEFAULT_LIMIT,
): URLSearchParams {
    const queryParams = new URLSearchParams()
    queryParams.set('status', 'approved')
    queryParams.set('page', String(parsePositiveInt(page, 1)))
    queryParams.set('limit', String(parsePositiveInt(limit, DEFAULT_LIMIT)))

    setIfPresent(queryParams, 'search', sourceParams.get('search'))
    setIfPresent(queryParams, 'type', sourceParams.get('type'))
    setIfPresent(queryParams, 'purpose', sourceParams.get('purpose'))
    setIfPresent(queryParams, 'city', sourceParams.get('city'))
    setIfPresent(queryParams, 'bairro', sourceParams.get('bairro'))
    setIfPresent(queryParams, 'bedrooms', sourceParams.get('bedrooms'))
    setIfPresent(queryParams, 'bathrooms', sourceParams.get('bathrooms'))
    setIfPresent(queryParams, 'minPrice', sourceParams.get('minPrice'))
    setIfPresent(queryParams, 'maxPrice', sourceParams.get('maxPrice'))
    setIfPresent(queryParams, 'code', sourceParams.get('code'))
    setIfPresent(queryParams, 'id', sourceParams.get('id'))
    const sort = sourceParams.get('sort')
    if (sort?.trim()) queryParams.set('sortBy', sort.trim())

    const areaUnit = normalizeAreaUnidade(sourceParams.get('areaUnit'))
    const minArea = sourceParams.get('minArea')
    if (minArea?.trim()) {
        const value = Number(minArea)
        if (!Number.isNaN(value) && value >= 0) {
            const canonical = areaInputToSquareMeters(value, areaUnit)
            if (!Number.isNaN(canonical)) queryParams.set('min_area_construida', String(canonical))
        }
    }

    const maxArea = sourceParams.get('maxArea')
    if (maxArea?.trim()) {
        const value = Number(maxArea)
        if (!Number.isNaN(value) && value >= 0) {
            const canonical = areaInputToSquareMeters(value, areaUnit)
            if (!Number.isNaN(canonical)) queryParams.set('max_area_construida', String(canonical))
        }
    }

    if (sourceParams.get('has_wifi') === '1') queryParams.set('has_wifi', 'true')
    if (sourceParams.get('tem_piscina') === '1') queryParams.set('tem_piscina', 'true')
    if (sourceParams.get('tem_energia_solar') === '1') queryParams.set('tem_energia_solar', 'true')
    if (sourceParams.get('tem_automacao') === '1') queryParams.set('tem_automacao', 'true')
    if (sourceParams.get('tem_ar_condicionado') === '1') queryParams.set('tem_ar_condicionado', 'true')
    if (sourceParams.get('eh_mobiliada') === '1' || sourceParams.get('amenity_mobiliada') === '1') {
        queryParams.append('amenities', 'MOBILIADA')
    }
    Object.entries(AMENITY_QUERY_KEYS).forEach(([key, amenity]) => {
        if (sourceParams.get(key) === '1') {
            queryParams.append('amenities', amenity)
        }
    })

    return queryParams
}

export async function fetchPublicPropertiesPage(
    sourceParams: URLSearchParams,
    page: number,
    limit = DEFAULT_LIMIT,
    options?: { signal?: AbortSignal },
): Promise<PropertyListingPageResult> {
    const safeLimit = parsePositiveInt(limit, DEFAULT_LIMIT)
    const safePage = parsePositiveInt(page, 1)
    const queryParams = buildPublicPropertiesQuery(sourceParams, safePage, safeLimit)

    try {
        const response = await fetch(`${API_BASE_URL}/properties?${queryParams.toString()}`, {
            cache: 'no-store',
            signal: options?.signal,
        })

        if (!response.ok) {
            console.error('Erro ao buscar imóveis da listagem:', response.status)
            return { properties: [], total: 0, page: safePage, totalPages: 0 }
        }

        const payload = await response.json()
        const rows: unknown[] = Array.isArray(payload?.properties)
            ? payload.properties
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload)
                    ? payload
                    : []
        const properties = rows
            .map((item: unknown) => normalizeProperty(item))
            .filter((item: Property | null): item is Property => item !== null)
        const total = parsePositiveInt(payload?.total, properties.length)
        const resolvedPage = parsePositiveInt(payload?.page, safePage)
        const totalPages = parsePositiveInt(
            payload?.totalPages,
            total > 0 ? Math.ceil(total / safeLimit) : properties.length > 0 ? resolvedPage : 0,
        )

        return {
            properties,
            total,
            page: resolvedPage,
            totalPages,
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return { properties: [], total: 0, page: safePage, totalPages: 0 }
        }
        console.error('Erro ao buscar imóveis da listagem:', error)
        return { properties: [], total: 0, page: safePage, totalPages: 0 }
    }
}
