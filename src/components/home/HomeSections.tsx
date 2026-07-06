import { fetchFeaturedProperties, fetchRecentProperties } from '@/lib/propertiesApi'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import RecentProperties from '@/components/home/RecentProperties'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'

export function FeaturedSkeleton() {
    return (
        <section className="py-16 lg:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-72 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <PropertyCardSkeleton count={3} />
                </div>
            </div>
        </section>
    )
}

export function RecentSkeleton() {
    return (
        <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-80 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <PropertyCardSkeleton count={8} />
                </div>
            </div>
        </section>
    )
}

type HomeDeal = 'sale' | 'rent'

export async function FeaturedSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchFeaturedProperties(6, deal)
    const title = deal === 'rent' ? 'Imóveis em Destaque para Aluguel' : 'Imóveis em Destaque para Venda'
    return <FeaturedCarousel properties={properties} title={title} />
}

export async function RecentSection({ deal = 'rent' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchRecentProperties(8, deal)
    const title = deal === 'rent' ? 'Imóveis em Destaque para Aluguel' : 'Imóveis em Destaque para Venda'
    const subtitle = deal === 'rent' ? 'Confira os imóveis em destaque para aluguel' : 'Confira os imóveis em destaque para venda'
    return (
        <RecentProperties
            properties={properties}
            title={title}
            subtitle={subtitle}
        />
    )
}
