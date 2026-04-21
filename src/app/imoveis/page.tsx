import { Suspense } from 'react'
import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'
import PropertyGrid from '@/components/property/PropertyGrid'
import SearchFilters from '@/components/search/SearchFilters'
import ListingFilterBar from '@/components/search/ListingFilterBar'
import ActiveFilterChips from '@/components/search/ActiveFilterChips'
import { Property } from '@/types/property'
import { areaInputToSquareMeters, normalizeAreaUnidade } from '@/lib/areaUnits'
import { hasActiveListingFilters } from '@/lib/listingFilterUtils'

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
        if (params.minPrice) queryParams.set('minPrice', params.minPrice)
        if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice)
        if (params.code?.trim()) queryParams.set('code', params.code.trim())
        if (params.id?.trim()) queryParams.set('id', params.id.trim())
        const areaUnit = normalizeAreaUnidade(params.areaUnit)
        if (params.minArea?.trim()) {
            const v = Number(params.minArea)
            if (!Number.isNaN(v) && v >= 0) {
                const m2 = areaInputToSquareMeters(v, areaUnit)
                if (!Number.isNaN(m2)) queryParams.set('min_area_construida', String(m2))
            }
        }
        if (params.maxArea?.trim()) {
            const v = Number(params.maxArea)
            if (!Number.isNaN(v) && v >= 0) {
                const m2 = areaInputToSquareMeters(v, areaUnit)
                if (!Number.isNaN(m2)) queryParams.set('max_area_construida', String(m2))
            }
        }
        if (params.tipo_lote) queryParams.set('tipo_lote', params.tipo_lote)
        if (params.sort) queryParams.set('sortBy', params.sort)

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


export default async function PropertiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    // Await searchParams (required in Next.js 15)
    const params = await searchParams

    // Fetch properties from real API
    const properties = await fetchProperties(params)
    const showEmptySearchIllustration = hasActiveListingFilters(params)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-4"
                    >
                        <Link href="/" className="hover:text-primary-600 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 dark:text-slate-100 font-medium">Imóveis</span>
                    </nav>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                        Encontre seu imóvel ideal
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside
                        aria-label="Filtros de busca"
                        className="lg:w-72 flex-shrink-0"
                    >
                        <SearchFilters />
                    </aside>

                    {/* Results */}
                    <main className="flex-1" aria-label="Resultados de imóveis">
                        <Suspense fallback={null}>
                            <ListingFilterBar />
                        </Suspense>
                        <Suspense fallback={null}>
                            <ActiveFilterChips />
                        </Suspense>
                        <Suspense fallback={<PropertyGrid properties={[]} isLoading={true} />}>
                            <PropertyGrid
                                properties={properties}
                                illustrateEmptySearch={showEmptySearchIllustration}
                            />
                        </Suspense>
                    </main>
                </div>
            </div>
        </div>
    )
}
