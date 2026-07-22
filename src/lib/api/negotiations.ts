import { apiClient } from '@/lib/api/client'
import { generateIdempotencyKey } from '@/lib/idempotency'

export type NegotiationStatus =
    | 'PROPOSAL_DRAFT'
    | 'PENDING_PROPOSAL'
    | 'PROPOSAL_SENT'
    | 'PROPOSAL_SIGNED'
    | 'PROPOSAL_REJECTED'
    | 'PROPOSAL_DECLINED'
    | 'PROPOSAL_REFUSED'
    | 'IN_NEGOTIATION'
    | 'DOCUMENTATION_PHASE'
    | 'CONTRACT_DRAFTING'
    | 'AWAITING_SIGNATURES'
    | 'SOLD'
    | 'RENTED'
    | 'CANCELLED'

export interface PaymentDetails {
    dinheiro: number
    financiamento: number
    permuta: number
    outros: number
}

export interface Negotiation {
    id: string
    propertyId: number
    status: NegotiationStatus
    finalValue: number
    proposalValidityDate?: string
    clientName?: string
    clientCpf?: string
}

export interface CreateProposalPayload {
    propertyId: number
    payment: PaymentDetails
    clientName: string
    clientCpf: string
    buyerEmail: string
    validadeDias: number
    idempotencyKey?: string
}

export interface CreateProposalResponse {
    negotiation: Negotiation
}

export async function createProposal(payload: CreateProposalPayload): Promise<CreateProposalResponse> {
    const idempotencyKey = payload.idempotencyKey ?? generateIdempotencyKey()
    return apiClient.post<CreateProposalResponse>('/negotiations/proposal', {
        propertyId: payload.propertyId,
        payment: payload.payment,
        clientName: payload.clientName,
        clientCpf: payload.clientCpf,
        buyerEmail: payload.buyerEmail,
        validadeDias: payload.validadeDias,
        idempotency_key: idempotencyKey,
    })
}

export async function uploadSignedProposal(negotiationId: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)

    await apiClient.post(
        `/negotiations/${encodeURIComponent(negotiationId)}/proposals/signed`,
        formData,
        {
            // upload usa multipart; `client` já trata remoção do Content-Type automático.
        },
    )
}


