'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
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
    const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, slidesToScroll: 1 })
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        return () => {
            emblaApi.off('select', onSelect)
        }
    }, [emblaApi, onSelect])

    if (!properties.length) {
        return (
            <section className="py-16 lg:py-24 bg-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
                    <p className="text-gray-400">Nenhum imóvel recente encontrado. Novos imóveis são adicionados diariamente.</p>
                </div>
            </section>
        )
    }

    return (
        <section className="py-16 lg:py-24 bg-transparent">
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
                            href="/imoveis?sort=created_at:desc"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
                        >
                            Ver todos os imóveis
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                <div className="mb-5 hidden items-center justify-end gap-2 sm:flex">
                    <button
                        onClick={() => emblaApi?.scrollPrev()}
                        disabled={!canScrollPrev}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => emblaApi?.scrollNext()}
                        disabled={!canScrollNext}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
                        aria-label="Próximo"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex gap-6">
                        {properties.map((property) => (
                            <div key={property.id} className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%-12px)] xl:flex-[0_0_calc(33.333%-16px)]">
                                <PropertyCard property={property} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-2">
                    {properties.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => emblaApi?.scrollTo(idx)}
                            aria-label={`Ir para slide ${idx + 1}`}
                            className="rounded-full p-1.5"
                        >
                            <span
                                className={`block rounded-full transition-all ${idx === selectedIndex ? 'h-2.5 w-8 bg-primary-600' : 'h-2.5 w-2.5 bg-gray-300'}`}
                            />
                        </button>
                    ))}
                </div>

                {/* View All Button (mobile) */}
                {showViewAll && (
                    <div className="mt-10 text-center sm:hidden">
                        <Link
                            href="/imoveis?sort=created_at:desc"
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
