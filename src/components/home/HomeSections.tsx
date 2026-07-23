import {
    fetchFeaturedProperties,
    fetchLaunchProperties,
    fetchMostAffordableProperties,
    fetchMostExpensiveProperties,
    fetchRecentProperties,
} from '@/lib/propertiesApi'
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

function homeBrowseHref(deal: HomeDeal, sort: 'created_at:desc' | 'price:desc' | 'price:asc') {
    const purpose = deal === 'rent' ? 'Aluguel' : 'Venda'
    return `/imoveis?purpose=${encodeURIComponent(purpose)}&sort=${encodeURIComponent(sort)}`
}

export async function FeaturedSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchFeaturedProperties(6, deal)
    const title = 'Imóveis em Destaque'
    return <FeaturedCarousel properties={properties} title={title} browseHref={homeBrowseHref(deal, 'created_at:desc')} />
}

export async function LaunchSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    if (deal !== 'sale') return null
    const properties = await fetchLaunchProperties(8)
    return (
        <RecentProperties
            properties={properties}
            title="Lançamentos"
            subtitle="Imóveis novos e oportunidades que acabaram de entrar no mercado."
            emptyMessage="Sem imóveis em lançamento ainda."
            browseHref="/imoveis?purpose=Venda&market_stage=LAUNCH&sort=created_at%3Adesc"
        />
    )
}

export async function RecentSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchRecentProperties(8, deal)
    const title = 'Acabou de chegar'
    const subtitle = 'Novidades publicadas recentemente.'
    return (
        <RecentProperties
            properties={properties}
            title={title}
            subtitle={subtitle}
            browseHref={homeBrowseHref(deal, 'created_at:desc')}
        />
    )
}

export async function MostExpensiveSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchMostExpensiveProperties(8, deal)
    return (
        <RecentProperties
            properties={properties}
            title="Para o seu conforto"
            subtitle="Imóveis com mais espaço, acabamento e comodidades."
            browseHref={homeBrowseHref(deal, 'price:desc')}
        />
    )
}

export async function MostAffordableSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const properties = await fetchMostAffordableProperties(8, deal)
    return (
        <RecentProperties
            properties={properties}
            title="Para economizar"
            subtitle="Boas oportunidades para o seu planejamento."
            browseHref={homeBrowseHref(deal, 'price:asc')}
        />
    )
}

/**
 * Mantém a descoberta útil depois que a pessoa escolhe uma finalidade, sem
 * misturar os resultados das vitrines principais com a finalidade oposta.
 */
export async function OppositeDealSection({ deal = 'sale' }: { deal?: HomeDeal } = {}) {
    const oppositeDeal: HomeDeal = deal === 'sale' ? 'rent' : 'sale'
    const properties = await fetchRecentProperties(8, oppositeDeal)
    const isRentalShelf = oppositeDeal === 'rent'

    return (
        <RecentProperties
            properties={properties}
            title={isRentalShelf ? 'Imóveis para alugar' : 'Imóveis à venda'}
            subtitle={isRentalShelf
                ? 'Opções de locação que acabaram de chegar.'
                : 'Opções de compra que acabaram de chegar.'}
            browseHref={homeBrowseHref(oppositeDeal, 'created_at:desc')}
        />
    )
}
