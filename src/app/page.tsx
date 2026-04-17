import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import AboutSection from '@/components/home/AboutSection'
import {
    FeaturedSection,
    FeaturedSkeleton,
    RecentSection,
    RecentSkeleton,
} from '@/components/home/HomeSections'

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
