'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Car, Maximize, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Property, formatPrice, getPromoSalePrice, getPromoRentPrice } from '@/types/property'
import FavoriteButton from '@/components/property/FavoriteButton'

interface PropertyCardProps {
    property: Property
    variant?: 'default' | 'featured'
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const images = property.images?.length ? property.images : ['/logo_circular.png']
    const hasMultipleImages = images.length > 1
    const isFeatured = variant === 'featured'
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
            className={`group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isFeatured ? 'ring-2 ring-accent-400' : 'border border-gray-100'
                }`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-30 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-10 hover:scale-110"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft className="w-5 h-5 drop-shadow-md" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-30 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-10 hover:scale-110"
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
                                        : 'bg-white/40 w-1.5'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Purpose Badge */}
                <div className={`absolute top-4 left-4 ${purposeBadge.className} shadow-lg backdrop-blur-sm bg-opacity-95`}>
                    {purposeBadge.label}
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20">
                    {property.type}
                </div>

            </div>

            {/* Content */}
            <div className="p-5">
                {/* Title */}
                <h3 className="font-display font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary-500" />
                    <span className="truncate font-medium">
                        {property.bairro ? `${property.bairro}, ` : ''}{property.city}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                    {property.bedrooms != null && property.bedrooms > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Bed className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{property.bedrooms} <span className="text-gray-400 font-normal">quartos</span></span>
                        </div>
                    )}
                    {property.bathrooms != null && property.bathrooms > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Bath className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{property.bathrooms} <span className="text-gray-400 font-normal">banhos</span></span>
                        </div>
                    )}
                    {property.garageSpots != null && property.garageSpots > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Car className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{property.garageSpots} <span className="text-gray-400 font-normal">vagas</span></span>
                        </div>
                    )}
                    {property.areaConstruida != null && property.areaConstruida > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Maximize className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{property.areaConstruida} <span className="text-gray-400 font-normal">m²</span></span>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
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
                                        <p className="text-sm text-gray-400 line-through font-medium">
                                            {formatPrice(basePrice)}
                                        </p>
                                        <p className="text-xl font-display font-bold text-green-600">
                                            {formatPrice(promo)}
                                            {property.priceRent && <span className="text-sm font-normal text-gray-500">/mês</span>}
                                        </p>
                                    </>
                                )
                            }
                            return (
                                <p className="text-xl font-display font-bold text-primary-700">
                                    {formatPrice(basePrice)}
                                    {property.priceRent && <span className="text-sm font-normal text-gray-500">/mês</span>}
                                </p>
                            )
                        })()}
                    </div>

                    <FavoriteButton propertyId={property.id} size="sm" />
                </div>
            </div>
        </Link>
    )
}
