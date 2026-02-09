'use client'

import { Property } from '@/types/property'
import PropertyCard from './PropertyCard'
import { Home } from 'lucide-react'
import Link from 'next/link'

interface PropertyGridProps {
    properties: Property[]
    isLoading?: boolean
    emptyMessage?: string
    columns?: {
        sm?: number
        md?: number
        lg?: number
        xl?: number
        '2xl'?: number
    }
}

export default function PropertyGrid({
    properties,
    isLoading = false,
    emptyMessage = 'Nenhum imóvel encontrado.',
    columns = { sm: 1, md: 2, lg: 3, xl: 3, '2xl': 4 }
}: PropertyGridProps) {

    if (isLoading) {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                        <div className="aspect-[4/3] bg-gray-200" />
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-3/4" />
                            <div className="flex gap-2">
                                <div className="h-4 bg-gray-200 rounded w-1/6" />
                                <div className="h-4 bg-gray-200 rounded w-1/6" />
                                <div className="h-4 bg-gray-200 rounded w-1/6" />
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-1/2 pt-2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {emptyMessage}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Tente ajustar os filtros, buscar em outra região ou limpar os critérios para ver mais resultados.
                </p>
                <Link
                    href="/imoveis"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20"
                >
                    Ver todos os imóveis
                </Link>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
            ))}
        </div>
    )
}
