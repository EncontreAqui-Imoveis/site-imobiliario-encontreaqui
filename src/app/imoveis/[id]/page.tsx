import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PropertyDetailClient from '@/components/property/PropertyDetailClient'
import { Property } from '@/types/property'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

// Helper to normalize property data
function normalizeProperty(data: any): Property {
    return {
        ...data,
        hasWifi: data.hasWifi ?? data.has_wifi,
        temPiscina: data.temPiscina ?? data.tem_piscina,
        temEnergiaSolar: data.temEnergiaSolar ?? data.tem_energia_solar,
        temAutomacao: data.temAutomacao ?? data.tem_automacao,
        temArCondicionado: data.temArCondicionado ?? data.tem_ar_condicionado,
        ehMobiliada: data.ehMobiliada ?? data.eh_mobiliada ?? data.is_furnished,
        garageSpots: data.garageSpots ?? data.garage_spots,
        valorCondominio: data.valorCondominio ?? data.valor_condominio,
        valorIptu: data.valorIptu ?? data.valor_iptu,
        areaConstruida: data.areaConstruida ?? data.area_construida,
        areaTerreno: data.areaTerreno ?? data.area_terreno,
        bedrooms: data.bedrooms ?? data.quartos,
        bathrooms: data.bathrooms ?? data.banheiros,
    }
}

async function getProperty(id: string): Promise<Property | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            cache: 'no-store', // Always fetch fresh data
        })

        if (!response.ok) return null

        const data = await response.json()
        const raw = data.data || data
        return normalizeProperty(raw)
    } catch (error) {
        console.error('Error fetching property:', error)
        return null
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const property = await getProperty(id)

    if (!property) {
        return {
            title: 'Imóvel não encontrado | Encontre Aqui Imóveis',
        }
    }

    const price = property.priceSale
        ? `R$ ${property.priceSale.toLocaleString('pt-BR')}`
        : property.priceRent
            ? `R$ ${property.priceRent.toLocaleString('pt-BR')}/mês`
            : 'Preço sob consulta'

    const title = `${property.title} | ${price} | Encontre Aqui Imóveis`
    const description = property.description?.slice(0, 160) || `Confira este imóvel em ${property.bairro}, ${property.city}. ${property.bedrooms} quartos, ${property.bathrooms} banheiros.`
    const images = property.images && property.images.length > 0 ? [property.images[0]] : []

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const property = await getProperty(id)

    if (!property) {
        notFound()
    }

    return <PropertyDetailClient initialProperty={property} />
}
