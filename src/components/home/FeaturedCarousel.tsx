'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PropertyCard from '@/components/property/PropertyCard'
import { Property } from '@/types/property'

interface FeaturedCarouselProps {
    properties: Property[]
    title?: string
}

export default function FeaturedCarousel({
    properties,
    title = 'Destaques especiais'
}: FeaturedCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: 'start',
            slidesToScroll: 1,
        },
        [Autoplay({ delay: 5000, stopOnInteraction: true })]
    )

    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        return () => {
            emblaApi.off('select', onSelect)
        }
    }, [emblaApi, onSelect])

    if (!properties.length) return null

    return (
        <section className="py-16 lg:py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {title}
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Os melhores imóveis selecionados para você
                        </p>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={scrollPrev}
                            disabled={!canScrollPrev}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={scrollNext}
                            disabled={!canScrollNext}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            aria-label="Próximo"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Carousel */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex gap-6">
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                className="flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                            >
                                <PropertyCard property={property} variant="featured" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {properties.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => emblaApi?.scrollTo(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === selectedIndex
                                    ? 'bg-primary-600 w-8'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Ir para slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
