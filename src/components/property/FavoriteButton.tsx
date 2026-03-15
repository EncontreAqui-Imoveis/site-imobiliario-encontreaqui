'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useFavorites } from '@/contexts/FavoritesContext'

interface FavoriteButtonProps {
    propertyId: number
    className?: string
    size?: 'sm' | 'md'
}

export default function FavoriteButton({ propertyId, className = '', size = 'md' }: FavoriteButtonProps) {
    const { isAuthenticated } = useUser()
    const { isFavorited: resolveFavorited, toggleFavorite } = useFavorites()
    const [loading, setLoading] = useState(false)

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
    const isFavorited = resolveFavorited(propertyId)

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated || loading) return

        setLoading(true)
        try {
            await toggleFavorite(propertyId)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    if (!isAuthenticated) return null

    return (
        <button
            onClick={toggle}
            disabled={loading}
            type="button"
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Favoritado. Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFavorited ? 'Favoritado' : 'Adicionar aos favoritos'}
            className={`${btnSize} rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${isFavorited
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white text-slate-500 hover:text-red-500'
                } ${loading ? 'opacity-50' : ''} ${className}`}
        >
            <Heart className={`${iconSize} ${isFavorited ? 'fill-current' : ''}`} />
        </button>
    )
}
