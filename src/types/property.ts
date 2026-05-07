export interface Property {
    id: number
    title: string
    description: string
    type: string
    status: 'pending_approval' | 'approved' | 'rejected' | 'rented' | 'sold',
    /** Motivo informado pelo admin em caso de rejeição */
    rejectionReason?: string | null,
    purpose: 'Venda' | 'Aluguel' | 'Venda e Aluguel'
    price: number
    priceSale?: number
    priceRent?: number
    address: string
    city: string
    state: string
    bairro?: string
    cep?: string
    semCep?: boolean
    bedrooms?: number
    bathrooms?: number
    suites?: number
    areaConstruida?: number
    /** Valor original informado para área construída (ex.: 2332). */
    areaConstruidaValor?: number
    /** Unidade informada para a área construída (`m2`, `hectare`, `alqueire`). */
    areaConstruidaUnidade?: 'm2' | 'alqueire' | 'hectare'
    semQuadra?: boolean
    semLote?: boolean
    areaTerreno?: number
    /** Valor original informado para a área do terreno (ex.: 2332). */
    areaTerrenoValor?: number
    /** Unidade informada para a área do terreno (`m2`, `alqueire`, `hectare`). */
    areaTerrenoUnidade?: 'm2' | 'alqueire' | 'hectare'
    garageSpots?: number
    amenities?: string[]
    hasWifi?: boolean
    temPiscina?: boolean
    temEnergiaSolar?: boolean
    temAutomacao?: boolean
    temArCondicionado?: boolean
    /**
     * Compatibilidade legado: também pode ser derivado pela presença de `MOBILIADA` em `amenities`.
     */
    ehMobiliada?: boolean
    valorCondominio?: number
    valorIptu?: number
    images: string[]
    videoUrl?: string
    brokerId?: number
    ownerId?: number
    brokerName?: string
    brokerPhone?: string
    brokerEmail?: string
    hasPendingEditRequest?: boolean
    pendingEditRequestId?: number
    createdAt: string
    code?: string
    public_code?: string
    slug?: string
    latitude?: number
    longitude?: number
    // Location details
    numero?: string
    quadra?: string
    lote?: string
    complemento?: string
    // Agency (imobiliária)
    agencyName?: string
    agencyAddress?: string
    agencyPhone?: string
    agencyEmail?: string
    agencyWebsite?: string
    // Promotional pricing
    promotionPrice?: number
    promotionalRentPrice?: number
    promotionStart?: string
    promotionEnd?: string
    negotiationId?: string
    negotiation?: {
        id: string
        status?: string
        clientName?: string
        value?: number
    }
}

export interface ImageFile {
    file: File
    preview: string
}

export function formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

/** Rótulo curto do intervalo de promoção para cards (fuso comercial). */
export function formatPromotionPeriodLabel(start?: string, end?: string): string | null {
    if (!start?.trim() || !end?.trim()) return null
    const tz = 'America/Sao_Paulo'
    const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: tz,
    }
    const dtf = new Intl.DateTimeFormat('pt-BR', opts)
    const ds = new Date(start)
    const de = new Date(end)
    if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime())) return null
    return `Promoção: ${dtf.format(ds)} — ${dtf.format(de)}`
}

/** Check if a promotion time window is currently active */
export function isPromotionActive(start?: string, end?: string): boolean {
    const now = new Date()
    if (start) {
        const s = new Date(start)
        if (!isNaN(s.getTime()) && now < s) return false
    }
    if (end) {
        const e = new Date(end)
        if (!isNaN(e.getTime()) && now > e) return false
    }
    return true
}

/** Resolve the effective promotional sale price (null if not active or not set) */
export function getPromoSalePrice(property: Property): number | null {
    if (!isPromotionActive(property.promotionStart, property.promotionEnd)) return null
    const base = property.priceSale ?? property.price
    const promo = property.promotionPrice
    if (promo && promo > 0 && promo < base) return promo
    return null
}

/** Resolve the effective promotional rent price (null if not active or not set) */
export function getPromoRentPrice(property: Property): number | null {
    if (!isPromotionActive(property.promotionStart, property.promotionEnd)) return null
    const base = property.priceRent ?? property.price
    const promo = property.promotionalRentPrice
    if (promo && promo > 0 && promo < base) return promo
    return null
}
