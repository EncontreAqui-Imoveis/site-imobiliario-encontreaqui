'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Bed, Bath, Car, Maximize, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Property, formatPrice } from '@/types/property'
import { useAuth } from '@/contexts/AuthContext'

interface PropertyCardProps {
    property: Property
    variant?: 'default' | 'featured'
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
    const router = useRouter()
    const { isAuthenticated, isFavorite, toggleFavorite } = useAuth()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const images = property.images?.length ? property.images : ['/placeholder-property.jpg']
    const hasMultipleImages = images.length > 1
    const isFeatured = variant === 'featured'
    const isPropertyFavorite = isFavorite(property.id)

    const purposeBadge = property.purpose.toLowerCase().includes('alug')
        ? { label: 'Aluguel', color: 'bg-accent-500 text-primary-900' }
        : { label: 'Venda', color: 'bg-primary-500 text-white' }

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated) {
            router.push(`/login?redirect=/imoveis/${property.id}`)
            return
        }

        toggleFavorite(property.id)
    }

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
            className={`group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-hover ${isFeatured ? 'border-2 border-accent-200' : 'border border-gray-100'
                }`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                            aria-label="Próxima imagem"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                        {/* Image Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {images.slice(0, 5).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex
                                        ? 'bg-white w-3'
                                        : 'bg-white/60'
                                        }`}
                                />
                            ))}
                            {images.length > 5 && (
                                <span className="text-white text-xs font-medium ml-1">+{images.length - 5}</span>
                            )}
                        </div>
                    </>
                )}

                {/* Purpose Badge */}
                <div className={`absolute top-3 left-3 ${purposeBadge.color} text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg`}>
                    {purposeBadge.label}
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow">
                    {property.type}
                </div>

                {/* Favorite Button - Always visible but shows login prompt if not authenticated */}
                <button
                    onClick={handleFavoriteClick}
                    className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-20 ${isPropertyFavorite
                        ? 'bg-red-500 opacity-100'
                        : 'bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110'
                        }`}
                    aria-label={isPropertyFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <Heart
                        className={`w-5 h-5 transition-colors ${isPropertyFavorite
                            ? 'text-white fill-white'
                            : 'text-gray-600 hover:text-red-500'
                            }`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5">
                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary-500" />
                    <span className="truncate">
                        {property.bairro ? `${property.bairro}, ` : ''}{property.city} - {property.state}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg leading-snug mb-3 line-clamp-2 group-hover:text-primary-500 transition-colors">
                    {property.title}
                </h3>

                {/* Features */}
                <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm mb-4">
                    {property.bedrooms != null && property.bedrooms > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-4 h-4" />
                            <span>{property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}</span>
                        </div>
                    )}
                    {property.bathrooms != null && property.bathrooms > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Bath className="w-4 h-4" />
                            <span>{property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>
                        </div>
                    )}
                    {property.garageSpots != null && property.garageSpots > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Car className="w-4 h-4" />
                            <span>{property.garageSpots} {property.garageSpots === 1 ? 'vaga' : 'vagas'}</span>
                        </div>
                    )}
                    {property.areaConstruida != null && property.areaConstruida > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Maximize className="w-4 h-4" />
                            <span>{property.areaConstruida} m²</span>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-gray-100">
                    {property.priceSale && property.priceSale > 0 && (
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500 font-medium">Venda</span>
                            <span className="text-xl font-bold text-primary-500">
                                {formatPrice(property.priceSale)}
                            </span>
                        </div>
                    )}
                    {property.priceRent && property.priceRent > 0 && (
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500 font-medium">Aluguel</span>
                            <span className="text-xl font-bold text-accent-600">
                                {formatPrice(property.priceRent)}
                                <span className="text-sm font-normal text-gray-500">/mês</span>
                            </span>
                        </div>
                    )}
                    {!property.priceSale && !property.priceRent && property.price > 0 && (
                        <span className="text-xl font-bold text-primary-500">
                            {formatPrice(property.price)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
