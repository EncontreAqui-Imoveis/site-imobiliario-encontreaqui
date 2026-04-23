'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Home, ChevronRight } from 'lucide-react'
import SearchFilters from '@/components/search/SearchFilters'
import ListingFilterBar from '@/components/search/ListingFilterBar'
import ActiveFilterChips from '@/components/search/ActiveFilterChips'
import InfinitePropertyResults from '@/components/property/InfinitePropertyResults'

export default function PropertiesPage() {
    const searchParams = useSearchParams()
    const [totalResults, setTotalResults] = useState(0)
    const queryString = useMemo(() => searchParams.toString(), [searchParams])

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-2 text-sm text-gray-500 mb-4"
                    >
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
                        {totalResults} {totalResults === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
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
                        <InfinitePropertyResults queryString={queryString} pageSize={10} onTotalChange={setTotalResults} />
                    </main>
                </div>
            </div>
        </div>
    )
}
