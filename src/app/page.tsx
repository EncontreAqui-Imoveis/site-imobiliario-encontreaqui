import HeroSection from '@/components/home/HeroSection'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import RecentProperties from '@/components/home/RecentProperties'
import AboutSection from '@/components/home/AboutSection'
import { getMockFeaturedProperties, getMockRecentProperties } from '@/lib/mockData'

export default function HomePage() {
    // Using mock data for demo - replace with API calls when backend is connected
    const featuredProperties = getMockFeaturedProperties()
    const recentProperties = getMockRecentProperties()

    return (
        <>
            <HeroSection />
            <FeaturedCarousel properties={featuredProperties} />
            <RecentProperties properties={recentProperties} />
            <AboutSection />
        </>
    )
}
