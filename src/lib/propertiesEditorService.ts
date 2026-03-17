import { apiClient } from '@/lib/api/client'
import { normalizeProperty } from '@/lib/propertiesApi'
import type { Property } from '@/types/property'

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
): Promise<{ requestId: number | null }> {
    const path =
        actor === 'client'
            ? `/properties/client/${propertyId}/edit-requests`
            : `/properties/${propertyId}/edit-requests`
    const response = await apiClient.post<{ requestId?: number | null }>(path, payload)
    const requestId = Number(response?.requestId ?? 0)
    return { requestId: Number.isFinite(requestId) && requestId > 0 ? requestId : null }
}
