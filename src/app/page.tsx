import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import AboutSection from '@/components/home/AboutSection'
import SignupDraftNotice from '@/components/auth/SignupDraftNotice'
import {
    FeaturedSection,
    FeaturedSkeleton,
    RecentSection,
    RecentSkeleton,
} from '@/components/home/HomeSections'

export default function HomePage() {
    return (
        <main aria-label="Página inicial do catálogo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
                <SignupDraftNotice />
            </div>
            <HeroSection />
            <Suspense fallback={<FeaturedSkeleton />}>
                <FeaturedSection />
            </Suspense>
            <Suspense fallback={<RecentSkeleton />}>
                <RecentSection />
            </Suspense>
            <AboutSection />
        </main>
    )
}
