import { apiClient } from '@/lib/api/client'
import { CreatePropertyActor, resolveCreatePropertyPath } from '@/lib/propertyCreate'

export interface UpdateProfilePayload {
    name?: string
    phone?: string
    city?: string
    state?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    cep?: string
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
}

export async function getMyProperties(): Promise<PropertySummary[]> {
    const response = await apiClient.get<{
        data?: PropertySummary[]
    } | PropertySummary[]>('/users/me/properties')

    return Array.isArray(response) ? response : (response?.data ?? [])
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
