import { Metadata } from 'next'
import PropertyDetailClient from '@/components/property/PropertyDetailClient'
import { fetchPropertyById, fetchSimilarProperties } from '@/lib/propertiesApi'
import type { Property } from '@/types/property'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const property = await fetchPropertyById(id)

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
    const description =
        (typeof property.description === 'string' ? property.description.slice(0, 160) : '') ||
        `Confira este imóvel em ${property.bairro}, ${property.city}. ${property.bedrooms} quartos, ${property.bathrooms} banheiros.`
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
    const property = await fetchPropertyById(id)
    
    let similarProperties: Property[] = []
    if (property) {
        similarProperties = await fetchSimilarProperties(property)
    }

    return (
        <PropertyDetailClient
            propertyId={id}
            initialProperty={property}
            initialSimilarProperties={similarProperties}
        />
    )
}
