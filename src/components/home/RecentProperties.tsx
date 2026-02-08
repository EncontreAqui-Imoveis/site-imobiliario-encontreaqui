import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'

interface RecentPropertiesProps {
    properties: Property[]
    title?: string
    showViewAll?: boolean
}

export default function RecentProperties({
    properties,
    title = 'Imóveis recentes',
    showViewAll = true
}: RecentPropertiesProps) {
    if (!properties.length) return null

    return (
        <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {title}
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Confira os imóveis adicionados recentemente
                        </p>
                    </div>

                    {showViewAll && (
                        <Link
                            href="/imoveis"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
                        >
                            Ver todos os imóveis
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>

                {/* View All Button (mobile) */}
                {showViewAll && (
                    <div className="mt-10 text-center sm:hidden">
                        <Link
                            href="/imoveis"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                        >
                            Ver todos os imóveis
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    )
}
