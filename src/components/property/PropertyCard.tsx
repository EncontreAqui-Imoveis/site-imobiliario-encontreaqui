'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Car, Maximize, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    Property,
    formatPrice,
    formatPromotionPeriodLabel,
    getPromoSalePrice,
    getPromoRentPrice,
} from '@/types/property'
import { capitalizePropertyTitle } from '@/lib/propertyTitleDisplay'
import { formatUnit } from '@/lib/propertyLabels'
import { areaUnitLabel, normalizeAreaUnidade, squareMetersToAreaInput } from '@/lib/areaUnits'
import FavoriteButton from '@/components/property/FavoriteButton'
import PhotoWatermark from '@/components/property/PhotoWatermark'

interface PropertyCardProps {
    property: Property
    variant?: 'default' | 'featured'
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
    const formatAreaDisplay = (valueInM2?: number, unitRaw?: string | null) => {
        if (valueInM2 == null || valueInM2 <= 0) return null
        const unit = normalizeAreaUnidade(unitRaw)
        const converted = squareMetersToAreaInput(valueInM2, unit)
        const asNumber = Number(converted)
        const formatted = Number.isFinite(asNumber)
            ? asNumber.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
            : converted
        return `${formatted} ${areaUnitLabel(unit)}`
    }
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
        ? { label: 'Aluguel', className: isFeatured ? 'rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700' : 'badge-gold' }
        : { label: 'Venda', className: 'badge-teal' }

    const promoSale = getPromoSalePrice(property)
    const promoRent = getPromoRentPrice(property)
    const effectivePromo = promoSale ?? promoRent
    const basePrice = property.priceSale ?? property.priceRent ?? property.price
    const promoPeriodLabel =
        effectivePromo != null ? formatPromotionPeriodLabel(property.promotionStart, property.promotionEnd) : null

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
            className={`group block bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isFeatured ? 'ring-2 ring-slate-200 border border-slate-200' : 'border border-gray-100'
                }`}
        >
            {/* Image Container */}
            <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
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
                            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-30 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100 focus:opacity-100"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft className="w-5 h-5 drop-shadow-md" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-30 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100 focus:opacity-100"
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
                                        ? 'bg-white w-4'
                                        : 'bg-white w-1.5'
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
                    <h3 className="font-display text-xl font-bold leading-tight text-gray-900 line-clamp-2 transition-colors group-hover:text-primary-600">
                        {capitalizePropertyTitle(property.title)}
                    </h3>
                    <div className="shrink-0 rounded-full bg-white shadow-sm">
                        <FavoriteButton propertyId={property.id} size="sm" />
                    </div>
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {property.type}
                </p>

                {/* Location */}
                <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0 text-primary-500" />
                    <span className="line-clamp-1 font-medium">
                        {property.bairro ? `${property.bairro}, ` : ''}{property.city}
                    </span>
                </div>

                {/* Price — hierarquia principal */}
                <div className="mb-5 border-b border-gray-100 pb-5">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {property.priceSale ? 'Venda' : (property.priceRent ? 'Aluguel' : 'Valor')}
                    </p>
                    {effectivePromo != null ? (
                        <>
                            <p className="text-base font-medium text-gray-400 line-through">
                                {formatPrice(basePrice)}
                            </p>
                            <p className="font-display text-xl font-bold tracking-tight text-primary-700 sm:text-2xl">
                                {formatPrice(effectivePromo)}
                                {property.priceRent && <span className="text-sm font-normal text-gray-500">/mês</span>}
                            </p>
                            {promoPeriodLabel && (
                                <p className="mt-1 text-[11px] font-medium text-amber-800">{promoPeriodLabel}</p>
                            )}
                        </>
                    ) : (
                        <p className="font-display text-xl font-bold tracking-tight text-primary-700 sm:text-2xl">
                            {formatPrice(basePrice)}
                            {property.priceRent && <span className="text-sm font-normal text-gray-500">/mês</span>}
                        </p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                    {property.bedrooms != null && property.bedrooms > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700">
                            <Bed className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="font-medium leading-tight">{formatUnit(property.bedrooms, 'Quarto', 'Quartos')}</span>
                        </div>
                    )}
                    {property.bathrooms != null && property.bathrooms > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700">
                            <Bath className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="font-medium leading-tight">{formatUnit(property.bathrooms, 'Banheiro', 'Banheiros')}</span>
                        </div>
                    )}
                    {property.garageSpots != null && property.garageSpots > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700">
                            <Car className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="font-medium leading-tight">{formatUnit(property.garageSpots, 'Garagem', 'Garagens')}</span>
                        </div>
                    )}
                    {property.areaTerreno != null && property.areaTerreno > 0 && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-gray-700">
                            <Maximize className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="font-medium leading-tight">
                                {formatAreaDisplay(property.areaTerreno, property.areaTerrenoUnidade)}
                            </span>
                            <span className="text-[11px] uppercase tracking-wide text-gray-500">Terreno</span>
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
