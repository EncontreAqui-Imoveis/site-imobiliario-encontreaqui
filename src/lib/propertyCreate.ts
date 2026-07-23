export const PROPERTY_TYPES = [
    'Casa',
    'Apartamento',
    'Terreno',
    'Flat',
    'Condomínio Fechado',
    'Área rural',
    'Rancho',
    'Galpão / Barracão',
    'Chácara',
    'Imóvel comercial',
    'Área comercial',
    'Cobertura / Penthouse',
    'Sobrado',
    'Kitnet',
    'Sala comercial',
    'Empresa',
    'Prédio',
] as const

export const PROPERTY_PURPOSES = ['Venda', 'Aluguel', 'Venda e Aluguel'] as const
export const MAX_PROPERTY_COUNT = 99
export const MAX_PROPERTY_AREA = 9999999.99
export const MAX_PROPERTY_PRICE = 9999999999.99
export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export const PROPERTY_CANONICAL_AMENITIES = [
    'WI-FI',
    'PISCINA',
    'ENERGIA SOLAR',
    'AUTOMAÇÃO',
    'AR CONDICIONADO',
    'POÇO ARTESIANO',
    'MOBILIADA',
    'ELEVADOR',
    'ACADEMIA',
    'CHURRASQUEIRA',
    'SALÃO DE FESTAS',
    'QUADRA',
    'CONDOMÍNIO FECHADO',
    'ACEITA PETS',
    'SISTEMA DE SEGURANÇA/CÂMERA',
    'SAUNA',
] as const

const SECURITY_CAMERA_AMENITY_CANONICAL = 'SISTEMA DE SEGURANÇA/CÂMERA'
const SECURITY_CAMERA_AMENITY_NORMALIZED = 'SISTEMA DE SEGURANÇA/CÂMERA'
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
const SECURITY_CAMERA_AMENITY_LEGACY_NORMALIZED = 'SISTEMA DE SEGURANÇA/CÂMARA'
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
const WIFI_AMENITY_CANONICAL = 'WI-FI'
const WIFI_AMENITY_NORMALIZED = WIFI_AMENITY_CANONICAL
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
const WIFI_AMENITY_LEGACY_NORMALIZED = 'WIFI'
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

function normalizeAmenityAlias(amenity: string): PropertyAmenity | null {
    const trimmed = amenity.trim()
    if (!trimmed) return null

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
    if (normalized === WIFI_AMENITY_NORMALIZED || normalized === WIFI_AMENITY_LEGACY_NORMALIZED) {
        return WIFI_AMENITY_CANONICAL
    }

    if (PROPERTY_CANONICAL_AMENITIES.includes(trimmed as PropertyAmenity)) {
        return trimmed as PropertyAmenity
    }

    const canonical = PROPERTY_CANONICAL_AMENITIES.find((candidate) => {
        const candidateNormalized = candidate
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
        return candidateNormalized === normalized
    })
    return canonical ?? null
}

export type PropertyAmenity = (typeof PROPERTY_CANONICAL_AMENITIES)[number]

export type CreatePropertyActor = 'broker' | 'client-owner'

export type CreatePropertyDraftData = {
    actorMode: CreatePropertyActor | null
    propertyType: string
    purpose: string
    marketStage: 'STANDARD' | 'LAUNCH'
    title: string
    description: string
    ownerName: string
    ownerPhone: string
    priceSale: string
    priceRent: string
    cep: string
    semCep: boolean
    state: string
    city: string
    bairro: string
    address: string
    numero: string
    complemento: string
    quadra: string
    lote: string
    semNumero: boolean
    semQuadra: boolean
    semLote: boolean
    bedrooms: string
    bathrooms: string
    garageSpots: string
    areaConstruida: string
    /** Unidade em que `areaConstruida` foi informada (`m2`, `hectare`, `alqueire`). */
    areaConstruidaUnidade: 'm2' | 'hectare' | 'alqueire'
    areaTerreno: string
    /** Unidade em que `areaTerreno` foi informado (`m2`, `hectare`, `alqueire`). */
    areaTerrenoUnidade: 'm2' | 'hectare' | 'alqueire'
    amenities: PropertyAmenity[]
    hasWifi: boolean
    temPiscina: boolean
    temEnergiaSolar: boolean
    temAutomacao: boolean
    temArCondicionado: boolean
    ehMobiliada: boolean
}

export type CreatePropertyPayload = CreatePropertyDraftData & {
    images: Array<File | string>
    video: File | string | null
}

const LOT_REQUIRED_TYPES = new Set<string>([
    'Terreno',
    'Área rural',
    'Rancho',
    'Chácara',
    'Área comercial',
])

const OPTIONAL_BAIRRO_PROPERTY_TYPES = new Set<string>(['Área rural', 'Chácara', 'Rancho'])

function appendIfPresent(
    formData: FormData,
    key: string,
    value: string | number | null | undefined,
    options?: { allowZero?: boolean },
) {
    if (value == null) return
    const raw = String(value).trim()
    if (!raw) return
    if (!options?.allowZero && Number(raw) === 0) return
    formData.append(key, raw)
}

function normalizeText(value: string): string {
    return value.trim()
}

function normalizeAmenitySelections(amenities: string[]): PropertyAmenity[] {
    const cleaned = amenities
        .map((amenity) => normalizeAmenityAlias(String(amenity)) )
        .filter((amenity): amenity is PropertyAmenity => Boolean(amenity))
    const unique = new Set<PropertyAmenity>()
    for (const amenity of cleaned) {
        unique.add(amenity as PropertyAmenity)
    }
    return [...unique]
}

export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '')
}

export function formatCepInput(value: string): string {
    const digits = digitsOnly(value).slice(0, 8)
    return digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function normalizeDecimalInput(value: string): number {
    const raw = value.trim()
    if (!raw) return 0

    let normalized = raw.replace(/[^\d,.\-]/g, '')
    const lastComma = normalized.lastIndexOf(',')
    const lastDot = normalized.lastIndexOf('.')

    if (lastComma > lastDot) {
        normalized = normalized.replace(/\./g, '').replace(',', '.')
    } else if (lastDot > lastComma) {
        normalized = normalized.replace(/,/g, '')
    }

    return Number.parseFloat(normalized) || 0
}

export function sanitizeDecimalInput(value: string): string {
    const cleaned = value.replace(/[^\d.,]/g, '')
    if (!cleaned) return ''

    const hasSeparator = /[.,]/.test(cleaned)
    const [integerPart, ...decimalParts] = cleaned.split(/[.,]/)
    const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '')
    const decimal = decimalParts.join('').slice(0, 2)
    const baseInteger = normalizedInteger || '0'

    if (!hasSeparator) return normalizedInteger
    if (!decimal) return `${baseInteger}.`
    return `${baseInteger}.${decimal}`
}

export function clampCountInput(value: string): string {
    const digits = digitsOnly(value).slice(0, 2)
    if (!digits) return ''
    return String(Math.min(MAX_PROPERTY_COUNT, Number.parseInt(digits, 10)))
}

export function clampAreaInput(value: string): string {
    const sanitized = sanitizeDecimalInput(value)
    const parsed = normalizeDecimalInput(sanitized)
    if (!Number.isFinite(parsed) || parsed <= 0) return sanitized
    if (parsed > MAX_PROPERTY_AREA) {
        return MAX_PROPERTY_AREA.toFixed(2)
    }
    return sanitized
}

export function supportsSale(purpose: string): boolean {
    return purpose.toLowerCase().includes('vend')
}

export function supportsRent(purpose: string): boolean {
    return purpose.toLowerCase().includes('alug')
}

export function requiresLotFields(propertyType: string): boolean {
    return LOT_REQUIRED_TYPES.has(propertyType)
}

export function isOptionalBairroPropertyType(propertyType: string): boolean {
    return OPTIONAL_BAIRRO_PROPERTY_TYPES.has(propertyType)
}

export function resolveCreatePropertyPath(actor: CreatePropertyActor): string {
    return actor === 'client-owner' ? '/properties/client' : '/properties'
}

export function buildCreatePropertyFormData(payload: CreatePropertyPayload): FormData {
    const formData = new FormData()

    const saleEnabled = supportsSale(payload.purpose)
    const rentEnabled = supportsRent(payload.purpose)
    const salePrice = Math.min(MAX_PROPERTY_PRICE, normalizeDecimalInput(payload.priceSale))
    const rentPrice = Math.min(MAX_PROPERTY_PRICE, normalizeDecimalInput(payload.priceRent))
    const basePrice = saleEnabled ? salePrice : rentEnabled ? rentPrice : 0
    const bedrooms = Math.min(MAX_PROPERTY_COUNT, normalizeDecimalInput(payload.bedrooms))
    const bathrooms = Math.min(MAX_PROPERTY_COUNT, normalizeDecimalInput(payload.bathrooms))
    const garageSpots = Math.min(MAX_PROPERTY_COUNT, normalizeDecimalInput(payload.garageSpots))
    const areaConstruida = Math.min(MAX_PROPERTY_AREA, normalizeDecimalInput(payload.areaConstruida))
    const areaTerreno = Math.min(MAX_PROPERTY_AREA, normalizeDecimalInput(payload.areaTerreno))

    formData.append('title', normalizeText(payload.title))
    formData.append('description', normalizeText(payload.description))
    formData.append('type', payload.propertyType)
    formData.append('purpose', payload.purpose)
    formData.append('market_stage', payload.marketStage)
    formData.append('price', String(basePrice))

    appendIfPresent(formData, 'price_sale', saleEnabled ? salePrice : null)
    appendIfPresent(formData, 'price_rent', rentEnabled ? rentPrice : null)
    appendIfPresent(formData, 'owner_name', normalizeText(payload.ownerName))
    appendIfPresent(formData, 'owner_phone', digitsOnly(payload.ownerPhone))
    formData.append('address', normalizeText(payload.address))
    appendIfPresent(formData, 'cep', payload.semCep ? null : digitsOnly(payload.cep))
    formData.append('sem_cep', payload.semCep ? '1' : '0')
    formData.append('city', normalizeText(payload.city))
    formData.append('state', payload.state)
    appendIfPresent(formData, 'numero', payload.semNumero ? null : normalizeText(payload.numero))
    appendIfPresent(formData, 'bairro', normalizeText(payload.bairro))
    appendIfPresent(formData, 'complemento', normalizeText(payload.complemento))
    appendIfPresent(formData, 'quadra', normalizeText(payload.quadra))
    appendIfPresent(formData, 'lote', normalizeText(payload.lote))
    formData.append('sem_numero', payload.semNumero ? '1' : '0')
    formData.append('sem_quadra', payload.semQuadra ? '1' : '0')
    formData.append('sem_lote', payload.semLote ? '1' : '0')

    appendIfPresent(formData, 'bedrooms', bedrooms, { allowZero: true })
    appendIfPresent(formData, 'bathrooms', bathrooms, { allowZero: true })
    appendIfPresent(formData, 'garage_spots', garageSpots, { allowZero: true })
    appendIfPresent(formData, 'area_construida_valor', areaConstruida, { allowZero: true })
    formData.append('area_construida_unidade', payload.areaConstruidaUnidade)
    appendIfPresent(formData, 'area_terreno_valor', areaTerreno, { allowZero: true })
    formData.append('area_terreno_unidade', payload.areaTerrenoUnidade)

    formData.append('has_wifi', payload.hasWifi ? '1' : '0')
    formData.append('tem_piscina', payload.temPiscina ? '1' : '0')
    formData.append('tem_energia_solar', payload.temEnergiaSolar ? '1' : '0')
    formData.append('tem_automacao', payload.temAutomacao ? '1' : '0')
    formData.append('tem_ar_condicionado', payload.temArCondicionado ? '1' : '0')
    const normalizedAmenities = new Set<PropertyAmenity>(normalizeAmenitySelections(payload.amenities))
    if (payload.hasWifi) normalizedAmenities.add('WI-FI')
    if (payload.temPiscina) normalizedAmenities.add('PISCINA')
    if (payload.temEnergiaSolar) normalizedAmenities.add('ENERGIA SOLAR')
    if (payload.temAutomacao) normalizedAmenities.add('AUTOMAÇÃO')
    if (payload.temArCondicionado) normalizedAmenities.add('AR CONDICIONADO')
    if (payload.ehMobiliada) normalizedAmenities.add('MOBILIADA')

    formData.append('eh_mobiliada', normalizedAmenities.has('MOBILIADA') ? '1' : '0')
    for (const amenity of normalizedAmenities) {
        formData.append('amenities', amenity)
    }

    for (const image of payload.images) {
        formData.append('images', image)
    }

    if (payload.video) {
        formData.append('video', payload.video)
    }

    return formData
}
