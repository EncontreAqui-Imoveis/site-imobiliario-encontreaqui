import { apiClient, type ApiError } from '@/lib/api/client'
import { generateIdempotencyKey } from '@/lib/idempotency'
import { reportObservedError } from '@/lib/observability'
import type { NegotiationSummary } from '@/types/negotiation'
import type { Property } from '@/types/property'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://site-imobiliario-backend-production.up.railway.app'

export async function fetchMyNegotiations(): Promise<NegotiationSummary[]> {
    return apiClient.get<NegotiationSummary[]>('/negotiations/mine')
}

export interface CreateProposalPayload {
    propertyId: number
    clientName: string
    clientCpf: string
    validadeDias: number
    idempotencyKey?: string
    sellerBrokerId?: number
    pagamento: {
        dinheiro: number
        permuta: number
        financiamento: number
        outros: number
    }
}

export async function createProposal(payload: CreateProposalPayload): Promise<void> {
    const { idempotencyKey, ...restPayload } = payload
    const generatedIdempotencyKey = idempotencyKey ?? generateIdempotencyKey()
    await apiClient.post('/negotiations/proposal', {
        ...restPayload,
        idempotency_key: generatedIdempotencyKey,
    })
}

export interface ApprovedBrokerLookup {
    id: number
    name: string
    email?: string
    phone?: string
    creci?: string
}

export async function searchApprovedBrokers(query: string): Promise<ApprovedBrokerLookup[]> {
    const data = await apiClient.get<{ data: ApprovedBrokerLookup[] }>(
        `/brokers/approved?search=${encodeURIComponent(query.trim())}&limit=5`,
    )
    return (Array.isArray(data) ? data : (data?.data || [])).filter(
        (broker) => broker.id > 0 && Boolean(broker.name),
    )
}

export async function fetchProposalTargetProperty(propertyId: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`)
    if (!response.ok) {
        const requestId = response.headers.get('x-request-id') || undefined
        reportObservedError(new Error('Imóvel não encontrado'), {
            module: 'proposal-wizard-page',
            status: response.status,
            requestId,
            url: response.url || undefined,
            message: 'Imóvel não encontrado',
        })
        throw new Error('Imóvel não encontrado')
    }

    try {
        const data = await response.json()
        return (data.data || data) as Property
    } catch (error) {
        const apiError = error as Partial<ApiError>
        if (apiError?.requestId) {
            reportObservedError(error, {
                module: 'proposal-wizard-page',
                requestId: apiError.requestId,
                message: apiError.message,
            })
        }
        throw new Error('Não foi possível carregar o imóvel.')
    }
}
