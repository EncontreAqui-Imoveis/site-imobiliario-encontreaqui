import { apiClient, API_BASE_URL, ApiError, type ApiErrorPayload } from '@/lib/api/client'
import { generateIdempotencyKey } from '@/lib/idempotency'
import { reportObservedError } from '@/lib/observability'
import { hasAuthTokenInBrowser } from '@/lib/auth/tokenStore'
import type { NegotiationSummary } from '@/types/negotiation'
import type { Property } from '@/types/property'
import { normalizeProperty } from '@/lib/propertiesApi'

const NEGOTIATIONS_LIST_ENDPOINTS = ['/negotiations/me', '/me/negotiations'] as const

function isNegotiationsListUnavailable(error: unknown): boolean {
    const status =
        error instanceof ApiError
            ? error.status
            : error && typeof error === 'object' && 'status' in error
                ? Number((error as { status?: unknown }).status)
                : NaN
    return (
        Number.isFinite(status) &&
        (status === 404 || status === 405 || status === 501)
    )
}

function parseNegotiationsResponse(response: unknown): NegotiationSummary[] {
    if (Array.isArray(response)) return response
    if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)) {
        return ((response as { data?: NegotiationSummary[] }).data ?? []) as NegotiationSummary[]
    }
    return []
}

export async function fetchMyNegotiations(): Promise<NegotiationSummary[]> {
    for (let index = 0; index < NEGOTIATIONS_LIST_ENDPOINTS.length; index += 1) {
        const endpoint = NEGOTIATIONS_LIST_ENDPOINTS[index]
        try {
            const response = await apiClient.get<{
                data?: NegotiationSummary[]
            } | NegotiationSummary[]>(endpoint)
            return parseNegotiationsResponse(response)
        } catch (error) {
            const isLastEndpoint = index >= NEGOTIATIONS_LIST_ENDPOINTS.length - 1
            if (!isLastEndpoint && isNegotiationsListUnavailable(error)) {
                continue
            }
            throw error
        }
    }

    return []
}

export async function fetchMyNegotiationById(negotiationId: string): Promise<NegotiationSummary | null> {
    const id = String(negotiationId ?? '').trim()
    if (!id) return null
    const items = await fetchMyNegotiations()
    return items.find((item) => String(item.id ?? '').trim() === id) ?? null
}

export interface CreateProposalPayload {
    propertyId: number
    clientName: string
    clientCpf: string
    validadeDias: number
    idempotencyKey?: string
    dealType?: string
    buyerUserId?: number
    capturingBrokerId?: number
    sellerBrokerId?: number
    proposalValue: number
    payment: {
        dinheiro: number
        permuta: number
        financiamento: number
        outros: number
    }
    pagamento?: {
        dinheiro: number
        permuta: number
        financiamento: number
        outros: number
    }
}

export async function createProposal(payload: CreateProposalPayload): Promise<void> {
    const { idempotencyKey, ...restPayload } = payload
    const generatedIdempotencyKey = idempotencyKey ?? generateIdempotencyKey()
    const paymentPayload = restPayload.payment ?? restPayload.pagamento
    try {
        await apiClient.post('/negotiations/proposal', {
            ...restPayload,
            payment: paymentPayload,
            pagamento: undefined,
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

export async function updateProposalDraft(
    negotiationId: string,
    payload: Omit<CreateProposalPayload, 'idempotencyKey'>,
): Promise<void> {
    const id = String(negotiationId ?? '').trim()
    if (!id) {
        throw new Error('Negociação inválida para edição.')
    }
    await apiClient.put(`/negotiations/${encodeURIComponent(id)}/draft`, {
        ...payload,
        payment: payload.payment ?? payload.pagamento,
        pagamento: undefined,
    })
}

export async function deleteProposal(negotiationId: string): Promise<void> {
    const id = String(negotiationId ?? '').trim()
    if (!id) {
        throw new Error('Negociação inválida para exclusão.')
    }
    await apiClient.delete(`/negotiations/${encodeURIComponent(id)}`)
}

export interface ApprovedBrokerLookup {
    id: number
    name: string
    email?: string
    phone?: string
    creci?: string
}

export interface ProposalUserLookup {
    id: number
    name: string
    email?: string
    cpf?: string
    phone?: string
    role?: string
}

export async function searchApprovedBrokers(query: string): Promise<ApprovedBrokerLookup[]> {
    const data = await apiClient.get<{ data: ApprovedBrokerLookup[] }>(
        `/brokers/approved?search=${encodeURIComponent(query.trim())}&limit=5`,
    )
    return (Array.isArray(data) ? data : (data?.data || [])).filter(
        (broker) => broker.id > 0 && Boolean(broker.name),
    )
}

export async function searchUsers(query: string): Promise<ProposalUserLookup[]> {
    const search = query.trim()
    if (search.length < 2) {
        return []
    }

    const data = await apiClient.get<{ data: ProposalUserLookup[] }>(
        `/users/search?q=${encodeURIComponent(search)}&limit=10`,
    )

    const items = Array.isArray(data) ? data : (data?.data || [])
    return items.filter((user) => user.id > 0 && Boolean(user.name))
}

export async function fetchProposalTargetProperty(propertyId: string): Promise<Property> {
    const normalizedId = encodeURIComponent(String(propertyId).trim())
    const publicUrl = `${API_BASE_URL}/public/properties/${normalizedId}`
    const publicResponse = await fetch(publicUrl, { cache: 'no-store' })

    if (publicResponse.ok) {
        try {
            const payload = await publicResponse.json()
            const normalized = normalizeProperty(payload?.data ?? payload, { imagePreset: 'detail' })
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
            const normalized = normalizeProperty(privatePayload, { imagePreset: 'detail' })
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
