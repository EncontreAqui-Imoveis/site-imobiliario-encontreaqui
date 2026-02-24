'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, ChevronRight, ArrowRight } from 'lucide-react'
import PropertyGallery from '@/components/property/PropertyGallery'
import PropertyInfo from '@/components/property/PropertyInfo'
import PropertySidebar from '@/components/property/PropertySidebar'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

interface PropertyDetailClientProps {
    initialProperty: Property
}

export default function PropertyDetailClient({ initialProperty }: PropertyDetailClientProps) {
    const property = initialProperty
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])

    useEffect(() => {
        if (!property.bairro) return

        async function fetchSimilar() {
            try {
                const similarRes = await fetch(
                    `${API_BASE_URL}/properties?bairro=${encodeURIComponent(property.bairro || '')}&limit=4&status=approved`
                )

                if (!similarRes.ok) return

                const similarData = await similarRes.json()
                const rawSimilar = similarData.data || similarData
                const allSimilar = Array.isArray(rawSimilar) ? rawSimilar : []

                const filtered = allSimilar
                    .filter((p: Property) => p.id !== property.id)
                    .slice(0, 3)

                setSimilarProperties(filtered)
            } catch (err) {
                console.error('Error fetching similar properties:', err)
            }
        }

        fetchSimilar()
    }, [property.bairro, property.id])

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">
                    <Link href="/" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <Link href="/imoveis" className="hover:text-primary-600 transition-colors flex-shrink-0">
                        Imóveis
                    </Link>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    <span className="text-gray-900 font-medium truncate">{property.title}</span>
                </nav>

                <div className="mb-8">
                    <PropertyGallery images={property.images} title={property.title} videoUrl={property.videoUrl} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <PropertyInfo property={property} />
                    </div>
                    <div className="lg:col-span-1">
                        <PropertySidebar property={property} />
                    </div>
                </div>

                {similarProperties.length > 0 && property.bairro && (
                    <div className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                                    Similares na região
                                </h2>
                                <p className="text-gray-500">
                                    Outras oportunidades em {property.bairro}
                                </p>
                            </div>
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {similarProperties.map((prop) => (
                                <PropertyCard key={prop.id} property={prop} />
                            ))}
                        </div>

                        <div className="mt-8 sm:hidden text-center">
                            <Link
                                href={`/imoveis?bairro=${encodeURIComponent(property.bairro)}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-colors"
                            >
                                Ver todos
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
