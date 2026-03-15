'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ApiError } from '@/lib/api/client'
import { addFavorite, getFavorites, removeFavorite } from '@/lib/api/favorites'
import { useUser } from '@/contexts/UserContext'

interface FavoritesContextValue {
    loading: boolean
    isFavorited: (propertyId: number) => boolean
    toggleFavorite: (propertyId: number) => Promise<boolean>
    refresh: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading: authLoading } = useUser()
    const [favoriteIds, setFavoriteIds] = useState<number[]>([])
    const [loading, setLoading] = useState(false)

    const refresh = useCallback(async () => {
        if (!isAuthenticated) {
            setFavoriteIds([])
            return
        }

        setLoading(true)
        try {
            const favorites = await getFavorites()
            setFavoriteIds(favorites.map((property) => property.id))
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated])

    useEffect(() => {
        if (authLoading) return
        void refresh()
    }, [authLoading, refresh])

    const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

    const toggleFavorite = useCallback(
        async (propertyId: number) => {
            const currentlyFavorited = favoriteSet.has(propertyId)
            setFavoriteIds((current) =>
                currentlyFavorited
                    ? current.filter((id) => id !== propertyId)
                    : [...current, propertyId]
            )

            try {
                if (currentlyFavorited) {
                    await removeFavorite(propertyId)
                } else {
                    await addFavorite(propertyId)
                }
                return !currentlyFavorited
            } catch (error) {
                if (error instanceof ApiError) {
                    if (!currentlyFavorited && error.status === 409) {
                        setFavoriteIds((current) => Array.from(new Set([...current, propertyId])))
                        return true
                    }
                    if (currentlyFavorited && error.status === 404) {
                        setFavoriteIds((current) => current.filter((id) => id !== propertyId))
                        return false
                    }
                }

                setFavoriteIds((current) =>
                    currentlyFavorited
                        ? Array.from(new Set([...current, propertyId]))
                        : current.filter((id) => id !== propertyId)
                )
                throw error
            }
        },
        [favoriteSet]
    )

    const value: FavoritesContextValue = {
        loading,
        isFavorited: (propertyId) => favoriteSet.has(propertyId),
        toggleFavorite,
        refresh,
    }

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (!context) {
        throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
    }
    return context
}
