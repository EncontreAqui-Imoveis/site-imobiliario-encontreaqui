import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import AboutSection from '@/components/home/AboutSection'
import {
    FeaturedSection,
    FeaturedSkeleton,
    RecentSection,
    RecentSkeleton,
} from '@/components/home/HomeSections'

type HomeDeal = 'sale' | 'rent'

function dealFromSearchParams(sp: Record<string, string | string[] | undefined> | null | undefined): HomeDeal {
    if (!sp) return 'sale'
    const v = sp.deal
    const one = Array.isArray(v) ? v[0] : v
    return one === 'rent' ? 'rent' : 'sale'
}

export default async function HomePage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const sp = searchParams != null ? await searchParams : undefined
    const deal = dealFromSearchParams(sp)

    return (
        <>
            <Suspense fallback={<div className="min-h-[min(100svh,900px)] bg-primary-950" aria-hidden />}>
                <HeroSection initialDeal={deal} />
            </Suspense>
            <Suspense fallback={<FeaturedSkeleton />}>
                <FeaturedSection deal="sale" />
            </Suspense>
            <Suspense fallback={<RecentSkeleton />}>
                <RecentSection deal="rent" />
            </Suspense>
            <AboutSection />
        </>
    )
}
