import { apiClient } from '@/lib/api/client'

export interface CloseDealPayload {
    type: 'sale' | 'rent'
    amount: number
    commission_rate: number
    commission_cycles: number
    recurrence_interval: string
}

export interface CloseDealResponse {
    status?: string
}

export async function closePropertyDeal(
    propertyId: number,
    payload: CloseDealPayload,
): Promise<CloseDealResponse> {
    return apiClient.post<CloseDealResponse>(`/properties/${propertyId}/close`, payload)
}

export async function cancelPropertyDeal(propertyId: number): Promise<CloseDealResponse> {
    return apiClient.post<CloseDealResponse>(`/properties/${propertyId}/cancel-deal`)
}
