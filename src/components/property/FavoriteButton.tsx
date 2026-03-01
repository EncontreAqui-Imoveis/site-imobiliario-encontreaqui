'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { addFavorite, removeFavorite } from '@/lib/api/favorites'
import { useUser } from '@/contexts/UserContext'

interface FavoriteButtonProps {
    propertyId: number
    initialFavorited?: boolean
    className?: string
    size?: 'sm' | 'md'
}

export default function FavoriteButton({ propertyId, initialFavorited = false, className = '', size = 'md' }: FavoriteButtonProps) {
    const { isAuthenticated } = useUser()
    const [isFavorited, setIsFavorited] = useState(initialFavorited)
    const [loading, setLoading] = useState(false)

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated || loading) return

        setLoading(true)
        try {
            if (isFavorited) {
                await removeFavorite(propertyId)
                setIsFavorited(false)
            } else {
                await addFavorite(propertyId)
                setIsFavorited(true)
            }
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
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`${btnSize} rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${isFavorited
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white text-slate-500 hover:text-red-500'
                } ${loading ? 'opacity-50' : ''} ${className}`}
        >
            <Heart className={`${iconSize} ${isFavorited ? 'fill-current' : ''}`} />
        </button>
    )
}
