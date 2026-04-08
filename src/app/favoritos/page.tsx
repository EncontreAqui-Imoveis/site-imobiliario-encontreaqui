'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { resolvePendingAction } from '@/lib/auth/routeResolution'
import GuestAccessCard from '@/components/auth/GuestAccessCard'
import { getFavorites, removeFavorite } from '@/lib/api/favorites'
import type { Property } from '@/types/property'
import PropertyCard from '@/components/property/PropertyCard'
import { Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function FavoritosPage() {
    const { session, loading: authLoading } = useUser()

    const [favorites, setFavorites] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const pendingAction = resolvePendingAction(session)

    useEffect(() => {
        if (session) {
            loadFavorites()
            return
        }
        setLoading(false)
    }, [session])

    const loadFavorites = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getFavorites()
            setFavorites(data)
        } catch {
            setError('Erro ao carregar favoritos.')
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (propertyId: number) => {
        try {
            await removeFavorite(propertyId)
            setFavorites(prev => prev.filter(p => p.id !== propertyId))
        } catch {
            // silently fail
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-24">
                <GuestAccessCard
                    icon={Heart}
                    title="Entre para guardar seus favoritos"
                    description="Com uma conta você salva imóveis, acompanha propostas e retoma sua busca de onde parou."
                />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Meus Favoritos</h1>
                    <p className="text-sm text-slate-500">{favorites.length} imóveis salvos</p>
                </div>
            </div>

            {pendingAction && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">{pendingAction.title}</p>
                    <p className="mt-1">{pendingAction.description}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={loadFavorites} className="mt-3 text-sm text-primary-600 font-medium hover:underline">
                        Tentar novamente
                    </button>
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <Heart className="w-16 h-16 mx-auto text-slate-200" />
                    <h2 className="text-lg font-semibold text-slate-700">Nenhum favorito ainda</h2>
                    <p className="text-sm text-slate-500">Explore imóveis e salve os que mais gostar.</p>
                    <Link
                        href="/imoveis"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        Explorar imóveis
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {favorites.map((property) => (
                        <div key={property.id} className="relative group">
                            <PropertyCard property={property} />
                            <button
                                onClick={() => handleRemove(property.id)}
                                className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover dos favoritos"
                            >
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
