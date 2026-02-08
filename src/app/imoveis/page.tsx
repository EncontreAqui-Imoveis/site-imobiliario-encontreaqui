import { Suspense } from 'react'
import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'
import PropertyCard from '@/components/property/PropertyCard'
import SearchFilters from '@/components/search/SearchFilters'
import { Property } from '@/types/property'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6acc.up.railway.app'

// Fetch properties from API
async function fetchProperties(params: Record<string, string | undefined>): Promise<Property[]> {
    try {
        // Build query params, only including non-empty values
        const queryParams = new URLSearchParams()

        // Always filter for approved properties
        queryParams.set('status', 'approved')

        if (params.search) queryParams.set('search', params.search)
        if (params.type) queryParams.set('type', params.type)
        if (params.purpose) queryParams.set('purpose', params.purpose)
        if (params.city) queryParams.set('city', params.city)
        if (params.bairro) queryParams.set('bairro', params.bairro)
        if (params.bedrooms) queryParams.set('bedrooms', params.bedrooms)
        if (params.bathrooms) queryParams.set('bathrooms', params.bathrooms)
        if (params.minPrice) queryParams.set('min_price', params.minPrice)
        if (params.maxPrice) queryParams.set('max_price', params.maxPrice)
        if (params.tipo_lote) queryParams.set('tipo_lote', params.tipo_lote)
        if (params.sort) queryParams.set('sort', params.sort)

        // Amenities
        if (params.has_wifi === '1') queryParams.set('has_wifi', 'true')
        if (params.tem_piscina === '1') queryParams.set('tem_piscina', 'true')
        if (params.tem_energia_solar === '1') queryParams.set('tem_energia_solar', 'true')
        if (params.tem_automacao === '1') queryParams.set('tem_automacao', 'true')
        if (params.tem_ar_condicionado === '1') queryParams.set('tem_ar_condicionado', 'true')
        if (params.eh_mobiliada === '1') queryParams.set('eh_mobiliada', 'true')

        const response = await fetch(`${API_BASE_URL}/properties?${queryParams.toString()}`, {
            next: { revalidate: 60 }, // Cache for 60 seconds
        })

        if (!response.ok) {
            console.error('API error:', response.status)
            return []
        }

        const data = await response.json()

        // Handle different API response formats
        if (Array.isArray(data)) {
            return data
        } else if (data.data && Array.isArray(data.data)) {
            return data.data
        } else if (data.properties && Array.isArray(data.properties)) {
            return data.properties
        }

        return []
    } catch (error) {
        console.error('Error fetching properties:', error)
        return []
    }
}

// Loading component
function PropertiesLoading() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-5 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-6 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function PropertiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    // Await searchParams (required in Next.js 15)
    const params = await searchParams

    // Fetch properties from real API
    const properties = await fetchProperties(params)

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary-600 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Imóveis</span>
                    </nav>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Encontre seu imóvel ideal
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <SearchFilters />
                    </aside>

                    {/* Results */}
                    <main className="flex-1">
                        <Suspense fallback={<PropertiesLoading />}>
                            {properties.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {properties.map((property: Property) => (
                                        <PropertyCard key={property.id} property={property} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Home className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Nenhum imóvel encontrado
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Tente ajustar os filtros para ver mais resultados.
                                    </p>
                                    <Link
                                        href="/imoveis"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all"
                                    >
                                        Limpar filtros
                                    </Link>
                                </div>
                            )}
                        </Suspense>
                    </main>
                </div>
            </div>
        </div>
    )
}
