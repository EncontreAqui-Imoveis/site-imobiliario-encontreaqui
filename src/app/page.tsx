import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import RecentProperties from '@/components/home/RecentProperties'
import AboutSection from '@/components/home/AboutSection'
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton'
import { fetchFeaturedProperties, fetchRecentProperties } from '@/lib/propertiesApi'

/* ---------- Skeleton fallbacks ---------- */

function FeaturedSkeleton() {
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

function RecentSkeleton() {
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

/* ---------- Async data components ---------- */

async function FeaturedSection() {
    const properties = await fetchFeaturedProperties(6)
    return <FeaturedCarousel properties={properties} />
}

async function RecentSection() {
    const properties = await fetchRecentProperties(8)
    return <RecentProperties properties={properties} />
}

/* ---------- Page ---------- */

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <Suspense fallback={<FeaturedSkeleton />}>
                <FeaturedSection />
            </Suspense>
            <Suspense fallback={<RecentSkeleton />}>
                <RecentSection />
            </Suspense>
            <AboutSection />
        </>
    )
}
