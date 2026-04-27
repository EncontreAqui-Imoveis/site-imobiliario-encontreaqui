import { apiClient } from '@/lib/api/client'
import { CreatePropertyActor, resolveCreatePropertyPath } from '@/lib/propertyCreate'
import { normalizeProperty } from '@/lib/propertiesApi'

export interface UpdateProfilePayload {
    name?: string
    phone?: string
    cep?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    city?: string
    state?: string
    withoutNumber?: boolean
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
    await apiClient.put('/users/me', payload)
}

export interface PropertySummary {
    id: number
    title: string
    status: string
    price: number
    city: string
    state: string
    type: string
    purpose: string
    imageUrl?: string
    createdAt: string
    hasPendingEditRequest?: boolean
    pendingEditRequestId?: number
    negotiationId?: string
    negotiationStatus?: string
}

export async function getMyProperties(): Promise<PropertySummary[]> {
    const response = await apiClient.get<unknown[]>('/properties/me')

    return (Array.isArray(response) ? response : [])
        .map((item) => normalizeProperty(item))
        .filter((item): item is NonNullable<ReturnType<typeof normalizeProperty>> => item !== null)
        .map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            price: item.priceSale ?? item.priceRent ?? item.price,
            city: item.city,
            state: item.state,
            type: item.type,
            purpose: item.purpose,
            imageUrl: item.images[0],
            createdAt: item.createdAt,
            hasPendingEditRequest: item.hasPendingEditRequest,
            pendingEditRequestId: item.pendingEditRequestId,
            negotiationId: item.negotiationId,
            negotiationStatus: item.negotiation?.status,
        }))
}

export async function createProperty(
    formData: FormData,
    actor: CreatePropertyActor = 'broker',
): Promise<{ id: number }> {
    const response = await apiClient.post<{ id?: number; propertyId?: number }>(
        resolveCreatePropertyPath(actor),
        formData,
    )

    const id = Number(response.id ?? response.propertyId ?? 0)
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error('Resposta inválida ao criar imóvel.')
    }

    return { id }
}

export async function updateProperty(id: number, formData: FormData): Promise<void> {
    await apiClient.put(`/properties/${id}`, formData)
}

export async function deleteProperty(id: number): Promise<void> {
    await apiClient.delete(`/properties/${id}`)
}
