import HeroSection from '@/components/home/HeroSection'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import RecentProperties from '@/components/home/RecentProperties'
import AboutSection from '@/components/home/AboutSection'
import { fetchFeaturedProperties, fetchRecentProperties } from '@/lib/propertiesApi'

export default async function HomePage() {
    const [featuredProperties, recentProperties] = await Promise.all([
        fetchFeaturedProperties(6),
        fetchRecentProperties(8),
    ])

    return (
        <>
            <HeroSection />
            <FeaturedCarousel properties={featuredProperties} />
            <RecentProperties properties={recentProperties} />
            <AboutSection />
        </>
    )
}
