'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Home, ChevronRight, Trash2, Building2, MapPin, BedDouble, Bath, Car, Maximize } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { propertiesApi } from '@/lib/api'

export default function FavoritesPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, favorites, removeFavorite } = useAuth()
    const [favoriteProperties, setFavoriteProperties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/favoritos')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        if (favorites.length > 0) {
            fetchFavoriteProperties()
        } else {
            setFavoriteProperties([])
            setLoading(false)
        }
    }, [favorites])

    const fetchFavoriteProperties = async () => {
        setLoading(true)
        try {
            const promises = favorites.map(id => propertiesApi.getById(id))
            const results = await Promise.all(promises)
            const validProperties = results
                .filter(res => res.data && !res.error)
                .map(res => res.data)
            setFavoriteProperties(validProperties)
        } catch (error) {
            console.error('Error fetching favorites:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = (propertyId: number) => {
        removeFavorite(propertyId)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary-500 transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Favoritos</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                            <Heart className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meus Favoritos</h1>
                            <p className="text-gray-500">
                                {favoriteProperties.length} {favoriteProperties.length === 1 ? 'imóvel salvo' : 'imóveis salvos'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : favoriteProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteProperties.map((property) => (
                            <div key={property.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-shadow">
                                {/* Image */}
                                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                    {property.images && property.images[0] ? (
                                        <img
                                            src={property.images[0]}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Building2 className="w-12 h-12" />
                                        </div>
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemove(property.id)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-500 hover:text-white rounded-full transition-colors shadow-md"
                                        title="Remover dos favoritos"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Purpose Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-3 py-1 bg-accent-500 text-primary-900 text-xs font-semibold rounded-full">
                                            {property.purpose === 'venda' ? 'Venda' : property.purpose === 'aluguel' ? 'Aluguel' : 'Venda/Aluguel'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{property.city}, {property.state}</span>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{property.title}</h3>

                                    {/* Features */}
                                    <div className="flex items-center gap-3 text-gray-600 text-sm mb-4">
                                        {property.bedrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <BedDouble className="w-4 h-4" />
                                                {property.bedrooms}
                                            </span>
                                        )}
                                        {property.bathrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Bath className="w-4 h-4" />
                                                {property.bathrooms}
                                            </span>
                                        )}
                                        {property.garage_spots > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Car className="w-4 h-4" />
                                                {property.garage_spots}
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {property.price_sale && (
                                        <p className="text-lg font-bold text-green-600">
                                            {Number(property.price_sale).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    )}
                                    {property.price_rent && !property.price_sale && (
                                        <p className="text-lg font-bold text-green-600">
                                            {Number(property.price_rent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                                        </p>
                                    )}

                                    {/* Action */}
                                    <Link
                                        href={`/imoveis/${property.id}`}
                                        className="block w-full mt-4 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        Ver Detalhes
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Você ainda não tem favoritos</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Navegue pelos imóveis e clique no coração para salvar os que mais gostar.
                        </p>
                        <Link
                            href="/imoveis"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold rounded-xl shadow-lg shadow-accent-500/25 transition-all"
                        >
                            <Home className="w-5 h-5" />
                            Explorar imóveis
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
