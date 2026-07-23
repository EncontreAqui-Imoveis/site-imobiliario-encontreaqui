'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Home, ChevronRight } from 'lucide-react'
import SearchFilters from '@/components/search/SearchFilters'
import ActiveFilterChips from '@/components/search/ActiveFilterChips'
import InfinitePropertyResults from '@/components/property/InfinitePropertyResults'

export default function PropertiesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [totalResults, setTotalResults] = useState(0)
    const queryString = useMemo(() => searchParams.toString(), [searchParams])

    const purpose = searchParams.get('purpose')
    const city = searchParams.get('city')
    const bairro = searchParams.get('bairro')
    const marketStage = searchParams.get('market_stage')

    let titleText = 'Imóveis'
    if (marketStage === 'LAUNCH') {
        titleText = 'Lançamentos'
    } else if (purpose === 'Venda') {
        titleText = 'Imóveis à venda'
    } else if (purpose === 'Aluguel') {
        titleText = 'Imóveis para alugar'
    }

    if (city) {
        titleText += ` em ${city}`
        if (bairro) {
            titleText += ` - ${bairro}`
        }
    } else {
        titleText += ' no Brasil'
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Breadcrumb */}
                <div className="flex flex-col gap-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary-600 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Imóveis</span>
                    </nav>
                </div>

                {/* Horizontal Filter Bar */}
                <Suspense fallback={<div className="h-16 bg-white border border-gray-200 rounded-2xl animate-pulse w-full" />}>
                    <SearchFilters />
                </Suspense>

                {/* Results Main Section */}
                <main className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-left" aria-label="Resultados de imóveis">
                    {/* Header: Dynamic Title & Sorting Dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{titleText}</h2>
                            <p className="text-sm text-gray-505 mt-1">{totalResults} {totalResults === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">Ordenar por:</span>
                            <select
                                value={searchParams.get('sort') || ''}
                                onChange={(e) => {
                                    const params = new URLSearchParams(searchParams.toString())
                                    if (e.target.value) {
                                        params.set('sort', e.target.value)
                                    } else {
                                        params.delete('sort')
                                    }
                                    router.push(`/imoveis?${params.toString()}`)
                                }}
                                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
                            >
                                <option value="">Mais recentes</option>
                                <option value="price:asc">Menor preço</option>
                                <option value="price:desc">Maior preço</option>
                                <option value="area_construida:desc">Maior área</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    <Suspense fallback={null}>
                        <ActiveFilterChips />
                    </Suspense>

                    {/* Property Grid Results */}
                    <InfinitePropertyResults queryString={queryString} pageSize={12} onTotalChange={setTotalResults} />
                </main>
            </div>
        </div>
    )
}
