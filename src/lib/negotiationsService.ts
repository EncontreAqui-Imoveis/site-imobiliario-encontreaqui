import { apiClient, API_BASE_URL, ApiError, type ApiErrorPayload } from '@/lib/api/client'
import { generateIdempotencyKey } from '@/lib/idempotency'
import { reportObservedError } from '@/lib/observability'
import { hasAuthTokenInBrowser } from '@/lib/auth/tokenStore'
import type { NegotiationSummary } from '@/types/negotiation'
import type { Property } from '@/types/property'
import { normalizeProperty } from '@/lib/propertiesApi'

export async function fetchMyNegotiations(): Promise<NegotiationSummary[]> {
    const response = await apiClient.get<{
        data?: NegotiationSummary[]
    } | NegotiationSummary[]>('/negotiations/mine')

    return Array.isArray(response) ? response : (response?.data ?? [])
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
    try {
        await apiClient.post('/negotiations/proposal', {
            ...restPayload,
            idempotency_key: generatedIdempotencyKey,
        })
    } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
            const payloadCode = String((error.payload as ApiErrorPayload | undefined)?.code ?? '')
                .trim()
                .toUpperCase()
            if (payloadCode === 'PROPOSAL_ALREADY_EXISTS') {
                throw new Error(
                    'Já existe uma proposta ativa para este imóvel. Abra "Minhas Propostas" para continuar o fluxo ou aguarde o encerramento antes de iniciar um novo ciclo.',
                )
            }
        }
        throw error
    }
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
    const normalizedId = encodeURIComponent(String(propertyId).trim())
    const publicUrl = `${API_BASE_URL}/public/properties/${normalizedId}`
    const publicResponse = await fetch(publicUrl, { cache: 'no-store' })

    if (publicResponse.ok) {
        try {
            const payload = await publicResponse.json()
            const normalized = normalizeProperty(payload?.data ?? payload)
            if (normalized) return normalized
            throw new Error('Imóvel indisponível para proposta.')
        } catch (error) {
            reportObservedError(error, {
                module: 'proposal-wizard-page',
                url: publicResponse.url || undefined,
                message: 'Falha ao normalizar imóvel público para proposta',
            })
            throw new Error('Não foi possível carregar o imóvel.')
        }
    }

    // Fallback privado só quando existir sessão; evita 401 ruidoso em links públicos.
    if (hasAuthTokenInBrowser()) {
        try {
            const privatePayload = await apiClient.get<unknown>(`/properties/${normalizedId}`)
            const normalized = normalizeProperty(privatePayload)
            if (normalized) return normalized
        } catch (error) {
            const apiError = error as Partial<ApiError>
            if (
                typeof apiError?.status === 'number' &&
                (apiError.status === 401 || apiError.status === 403 || apiError.status === 404)
            ) {
                throw new Error('Imóvel indisponível para proposta.')
            }
            throw error
        }
    }

    const requestId = publicResponse.headers.get('x-request-id') || undefined
    reportObservedError(new Error('Imóvel indisponível para proposta'), {
        module: 'proposal-wizard-page',
        status: publicResponse.status,
        requestId,
        url: publicResponse.url || undefined,
        message: 'Imóvel indisponível para proposta',
    })
    throw new Error('Imóvel indisponível para proposta.')
}
