import { apiClient } from '@/lib/api/client'

export type NegotiationStatus =
    | 'PROPOSAL_DRAFT'
    | 'PROPOSAL_SENT'
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
    clientName?: string
    clientCpf?: string
}

export interface CreateProposalResponse {
    negotiation: Negotiation
}

export async function createProposal(payload: CreateProposalPayload): Promise<CreateProposalResponse> {
    return apiClient.post<CreateProposalResponse>('/negotiations/proposal', payload)
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

