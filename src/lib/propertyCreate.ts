import { sanitizeText } from '@/lib/sanitize'

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
export const LOT_TYPES = ['meio', 'inteiro'] as const
export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type CreatePropertyActor = 'broker' | 'client-owner'

export type CreatePropertyDraftData = {
    actorMode: CreatePropertyActor | null
    propertyType: string
    purpose: string
    title: string
    description: string
    ownerName: string
    ownerPhone: string
    priceSale: string
    priceRent: string
    cep: string
    state: string
    city: string
    bairro: string
    address: string
    numero: string
    complemento: string
    quadra: string
    lote: string
    tipoLote: string
    semNumero: boolean
    bedrooms: string
    bathrooms: string
    garageSpots: string
    areaConstruida: string
    areaTerreno: string
    hasWifi: boolean
    temPiscina: boolean
    temAutomacao: boolean
    temArCondicionado: boolean
    ehMobiliada: boolean
    valorCondominio: string
}

export type CreatePropertyPayload = CreatePropertyDraftData & {
    images: File[]
    video: File | null
}

const LOT_REQUIRED_TYPES = new Set<string>([
    'Terreno',
    'Área rural',
    'Rancho',
    'Chácara',
    'Área comercial',
])

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

export function supportsSale(purpose: string): boolean {
    return purpose.toLowerCase().includes('vend')
}

export function supportsRent(purpose: string): boolean {
    return purpose.toLowerCase().includes('alug')
}

export function requiresLotFields(propertyType: string): boolean {
    return LOT_REQUIRED_TYPES.has(propertyType)
}

export function resolveCreatePropertyPath(actor: CreatePropertyActor): string {
    return actor === 'client-owner' ? '/properties/client' : '/properties'
}

export function buildCreatePropertyFormData(payload: CreatePropertyPayload): FormData {
    const formData = new FormData()

    const saleEnabled = supportsSale(payload.purpose)
    const rentEnabled = supportsRent(payload.purpose)
    const salePrice = normalizeDecimalInput(payload.priceSale)
    const rentPrice = normalizeDecimalInput(payload.priceRent)
    const basePrice = saleEnabled ? salePrice : rentEnabled ? rentPrice : 0

    formData.append('title', sanitizeText(payload.title))
    formData.append('description', sanitizeText(payload.description))
    formData.append('type', payload.propertyType)
    formData.append('purpose', payload.purpose)
    formData.append('price', String(basePrice))

    appendIfPresent(formData, 'price_sale', saleEnabled ? salePrice : null)
    appendIfPresent(formData, 'price_rent', rentEnabled ? rentPrice : null)
    appendIfPresent(formData, 'owner_name', sanitizeText(payload.ownerName))
    appendIfPresent(formData, 'owner_phone', digitsOnly(payload.ownerPhone))
    formData.append('address', sanitizeText(payload.address))
    appendIfPresent(formData, 'cep', digitsOnly(payload.cep))
    formData.append('city', sanitizeText(payload.city))
    formData.append('state', payload.state)
    appendIfPresent(formData, 'numero', payload.semNumero ? null : sanitizeText(payload.numero))
    appendIfPresent(formData, 'bairro', sanitizeText(payload.bairro))
    appendIfPresent(formData, 'complemento', sanitizeText(payload.complemento))
    appendIfPresent(formData, 'quadra', sanitizeText(payload.quadra))
    appendIfPresent(formData, 'lote', sanitizeText(payload.lote))
    appendIfPresent(formData, 'tipo_lote', sanitizeText(payload.tipoLote))
    formData.append('sem_numero', payload.semNumero ? '1' : '0')

    appendIfPresent(formData, 'bedrooms', normalizeDecimalInput(payload.bedrooms))
    appendIfPresent(formData, 'bathrooms', normalizeDecimalInput(payload.bathrooms))
    appendIfPresent(formData, 'garage_spots', normalizeDecimalInput(payload.garageSpots))
    appendIfPresent(formData, 'area_construida', normalizeDecimalInput(payload.areaConstruida))
    appendIfPresent(formData, 'area_terreno', normalizeDecimalInput(payload.areaTerreno))
    appendIfPresent(formData, 'valor_condominio', normalizeDecimalInput(payload.valorCondominio))

    formData.append('has_wifi', payload.hasWifi ? '1' : '0')
    formData.append('tem_piscina', payload.temPiscina ? '1' : '0')
    formData.append('tem_automacao', payload.temAutomacao ? '1' : '0')
    formData.append('tem_ar_condicionado', payload.temArCondicionado ? '1' : '0')
    formData.append('eh_mobiliada', payload.ehMobiliada ? '1' : '0')

    for (const image of payload.images) {
        formData.append('images', image)
    }

    if (payload.video) {
        formData.append('video', payload.video)
    }

    return formData
}
