export interface Property {
    id: number
    title: string
    description: string
    type: string
    status: 'pending_approval' | 'approved' | 'rejected' | 'rented' | 'sold'
    purpose: 'Venda' | 'Aluguel' | 'Venda e Aluguel'
    price: number
    priceSale?: number
    priceRent?: number
    address: string
    city: string
    state: string
    bairro?: string
    cep?: string
    bedrooms?: number
    bathrooms?: number
    areaConstruida?: number
    /** Unidade em que o usuário cadastrou a área construída; `areaConstruida` no API é sempre m². */
    areaConstruidaUnidade?: 'm2' | 'alqueire' | 'hectare'
    semQuadra?: boolean
    semLote?: boolean
    areaTerreno?: number
    garageSpots?: number
    hasWifi?: boolean
    temPiscina?: boolean
    temEnergiaSolar?: boolean
    temAutomacao?: boolean
    temArCondicionado?: boolean
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
    latitude?: number
    longitude?: number
    // Location details
    numero?: string
    quadra?: string
    lote?: string
    complemento?: string
    tipoLote?: string
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
