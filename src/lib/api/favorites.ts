import { apiClient } from '@/lib/api/client'
import type { Property } from '@/types/property'

export async function getFavorites(): Promise<Property[]> {
    return apiClient.get<Property[]>('/users/favorites')
}

export async function addFavorite(propertyId: number): Promise<void> {
    await apiClient.post(`/users/favorites/${encodeURIComponent(propertyId)}`)
}

export async function removeFavorite(propertyId: number): Promise<void> {
    await apiClient.delete(`/users/favorites/${encodeURIComponent(propertyId)}`)
}
