import { apiClient } from '@/lib/api/client'
import { normalizeProperty } from '@/lib/propertiesApi'
import type { Property } from '@/types/property'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

export async function fetchEditableProperty(propertyId: string): Promise<Property> {
    const response = await apiClient.get<unknown>(`/properties/${encodeURIComponent(propertyId)}`)
    const normalized = normalizeProperty(response)
    if (!normalized) {
        throw new Error('Imóvel não encontrado')
    }
    return normalized
}

export async function saveEditedProperty(
    propertyId: number,
    payload: unknown,
    actor: 'broker' | 'client',
): Promise<void> {
    const path = actor === 'client' ? `/properties/client/${propertyId}` : `/properties/${propertyId}`
    await apiClient.put(path, payload)
}
