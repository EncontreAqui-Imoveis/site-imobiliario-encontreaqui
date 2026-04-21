'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Car, Maximize, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Property, formatPrice, getPromoSalePrice, getPromoRentPrice } from '@/types/property'
import { capitalizePropertyTitle } from '@/lib/propertyTitleDisplay'
import FavoriteButton from '@/components/property/FavoriteButton'
import PhotoWatermark from '@/components/property/PhotoWatermark'

interface PropertyCardProps {
    property: Property
    variant?: 'default' | 'featured'
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const images = property.images?.length ? property.images : ['/logo_circular.png']
    const hasMultipleImages = images.length > 1
    const isFeatured = variant === 'featured'
    const statusMeta = property.status === 'pending_approval'
        ? { label: 'Em análise', className: 'bg-amber-100 text-amber-800' }
        : property.status === 'sold'
            ? { label: 'Vendido', className: 'bg-blue-100 text-blue-800' }
            : property.status === 'rented'
                ? { label: 'Alugado', className: 'bg-indigo-100 text-indigo-800' }
                : property.status === 'rejected'
                    ? { label: 'Rejeitado', className: 'bg-red-100 text-red-800' }
                    : { label: 'Disponível', className: 'bg-slate-100 text-slate-700' }
    const purposeBadge = property.purpose.toLowerCase().includes('alug')
        ? { label: 'Aluguel', className: 'badge-gold' }
        : { label: 'Venda', className: 'badge-teal' }

    const goToPrevious = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const goToNext = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    return (
        <Link
            href={`/imoveis/${property.id}`}
            className={`group block bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isFeatured ? 'ring-2 ring-accent-400' : 'border border-gray-100 dark:border-slate-700'
                }`}
        >
            {/* Image Container */}
            <div className="relative aspect-[5/4] overflow-hidden bg-gray-100 dark:bg-slate-800">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

                <PhotoWatermark />

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white dark:bg-slate-900/20 hover:bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-30 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-10 hover:scale-110"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft className="w-5 h-5 drop-shadow-md" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white dark:bg-slate-900/20 hover:bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-30 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-10 hover:scale-110"
                            aria-label="Próxima imagem"
                        >
                            <ChevronRight className="w-5 h-5 drop-shadow-md" />
                        </button>

                        {/* Image Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {images.slice(0, 5).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex
                                        ? 'bg-white dark:bg-slate-900 w-4'
                                        : 'bg-white dark:bg-slate-900/40 w-1.5'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
                    <div className={`${purposeBadge.className} shadow-lg backdrop-blur-sm bg-opacity-95`}>
                        {purposeBadge.label}
                    </div>
                    <div className={`rounded-full px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-sm ${statusMeta.className}`}>
                        {statusMeta.label}
                    </div>
                </div>

            </div>

            {/* Content */}
            <div className="p-6">
                {/* Title */}
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold leading-tight text-gray-900 dark:text-slate-100 line-clamp-2 transition-colors group-hover:text-primary-600">
                        {capitalizePropertyTitle(property.title)}
                    </h3>
                    <div className="shrink-0 rounded-full bg-white dark:bg-slate-900 shadow-sm">
                        <FavoriteButton propertyId={property.id} size="sm" />
                    </div>
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {property.type}
                </p>

                {/* Location */}
                <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 shrink-0 text-primary-500" />
                    <span className="line-clamp-1 font-medium">
                        {property.bairro ? `${property.bairro}, ` : ''}{property.city}
                    </span>
                </div>

                {/* Price — hierarquia principal */}
                <div className="mb-5 border-b border-gray-100 dark:border-slate-700 pb-5">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        {property.priceSale ? 'Venda' : (property.priceRent ? 'Aluguel' : 'Valor')}
                    </p>
                    {(() => {
                        const promoSale = getPromoSalePrice(property)
                        const promoRent = getPromoRentPrice(property)
                        const basePrice = property.priceSale ?? property.priceRent ?? property.price
                        const promo = promoSale ?? promoRent
                        if (promo) {
                            return (
                                <>
                                    <p className="text-base font-medium text-gray-400 dark:text-slate-500 line-through">
                                        {formatPrice(basePrice)}
                                    </p>
                                    <p className="font-display text-3xl font-bold tracking-tight text-primary-700 sm:text-4xl">
                                        {formatPrice(promo)}
                                        {property.priceRent && <span className="text-base font-normal text-gray-500 dark:text-slate-400">/mês</span>}
                                    </p>
                                </>
                            )
                        }
                        return (
                            <p className="font-display text-3xl font-bold tracking-tight text-primary-700 sm:text-4xl">
                                {formatPrice(basePrice)}
                                {property.priceRent && <span className="text-base font-normal text-gray-500 dark:text-slate-400">/mês</span>}
                            </p>
                        )
                    })()}
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                    {property.bedrooms != null && property.bedrooms > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700 dark:text-slate-300">
                            <Bed className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium leading-tight">{property.bedrooms} quartos</span>
                        </div>
                    )}
                    {property.bathrooms != null && property.bathrooms > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700 dark:text-slate-300">
                            <Bath className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium leading-tight">{property.bathrooms} banheiros</span>
                        </div>
                    )}
                    {property.garageSpots != null && property.garageSpots > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700 dark:text-slate-300">
                            <Car className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium leading-tight">{property.garageSpots} vagas</span>
                        </div>
                    )}
                    {property.areaConstruida != null && property.areaConstruida > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700 dark:text-slate-300">
                            <Maximize className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium leading-tight">{property.areaConstruida} m²</span>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-500">
                    Abra para ver fotos, localização detalhada e informações completas.
                </p>
            </div>
        </Link>
    )
}
