import { apiClient } from '@/lib/api/client'
import type { Property } from '@/types/property'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

export async function fetchEditableProperty(propertyId: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`)
    if (!response.ok) {
        throw new Error('Imóvel não encontrado')
    }

    const data = await response.json()
    return (data.data || data) as Property
}

export async function saveEditedProperty(
    propertyId: number,
    payload: unknown,
    actor: 'broker' | 'client',
): Promise<void> {
    const path = actor === 'client' ? `/properties/client/${propertyId}` : `/properties/${propertyId}`
    await apiClient.put(path, payload)
}
