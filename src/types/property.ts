export interface Property {
    id: number
    title: string
    description: string
    type: 'Casa' | 'Apartamento' | 'Terreno' | 'Propriedade Rural' | 'Propriedade Comercial'
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
    brokerName?: string
    brokerPhone?: string
    brokerEmail?: string
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
}

export interface ImageFile {
    file: File
    preview: string
}

export function formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}
