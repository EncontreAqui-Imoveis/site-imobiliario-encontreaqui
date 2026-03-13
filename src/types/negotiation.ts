export type NegotiationStatus =
    | 'PENDING_PROPOSAL'
    | 'PROPOSAL_SENT'
    | 'PROPOSAL_SIGNED'
    | 'IN_CONTRACT'
    | 'CONTRACT_FINALIZED'
    | 'IN_NEGOTIATION'
    | 'DOCUMENTATION_PHASE'
    | 'CONTRACT_DRAFTING'
    | 'AWAITING_SIGNATURES'
    | 'SOLD'
    | 'RENTED'
    | 'CANCELLED'

export interface NegotiationSummary {
    id: string
    propertyId: number
    propertyTitle: string
    propertyCity?: string
    propertyState?: string
    propertyImage?: string
    status: NegotiationStatus
    clientName?: string
    clientCpf?: string
    createdAt: string
    updatedAt: string
    proposalValidUntil?: string
}

export interface NegotiationDetail extends NegotiationSummary {
    payment: {
        dinheiro: number
        financiamento: number
        permuta: number
        outros: number
    }
    documents: NegotiationDocument[]
    history: NegotiationHistoryEntry[]
}

export interface NegotiationDocument {
    id: string
    negotiationId: string
    documentType: string
    originalFileName: string
    fileUrl: string
    side?: 'seller' | 'buyer'
    createdAt: string
}

export interface NegotiationHistoryEntry {
    id: string
    fromStatus: NegotiationStatus
    toStatus: NegotiationStatus
    changedAt: string
    changedBy?: string
    notes?: string
}

export function getStatusLabel(status: NegotiationStatus): string {
    const labels: Record<NegotiationStatus, string> = {
        PENDING_PROPOSAL: 'Proposta Pendente',
        PROPOSAL_SENT: 'Proposta Enviada',
        PROPOSAL_SIGNED: 'Proposta Assinada',
        IN_CONTRACT: 'Em Contrato',
        CONTRACT_FINALIZED: 'Contrato Finalizado',
        IN_NEGOTIATION: 'Em Negociação',
        DOCUMENTATION_PHASE: 'Em análise documental',
        CONTRACT_DRAFTING: 'Em confecção da minuta',
        AWAITING_SIGNATURES: 'Aguardando assinaturas',
        SOLD: 'Vendido',
        RENTED: 'Alugado',
        CANCELLED: 'Cancelada',
    }
    return labels[status] || status
}

export function getStatusColor(status: NegotiationStatus): string {
    const colors: Record<NegotiationStatus, string> = {
        PENDING_PROPOSAL: 'bg-amber-50 text-amber-700',
        PROPOSAL_SENT: 'bg-blue-50 text-blue-700',
        PROPOSAL_SIGNED: 'bg-indigo-50 text-indigo-700',
        IN_CONTRACT: 'bg-purple-50 text-purple-700',
        CONTRACT_FINALIZED: 'bg-slate-100 text-slate-700',
        IN_NEGOTIATION: 'bg-slate-100 text-slate-700',
        DOCUMENTATION_PHASE: 'bg-orange-50 text-orange-700',
        CONTRACT_DRAFTING: 'bg-sky-50 text-sky-700',
        AWAITING_SIGNATURES: 'bg-violet-50 text-violet-700',
        SOLD: 'bg-slate-100 text-slate-700',
        RENTED: 'bg-blue-50 text-blue-700',
        CANCELLED: 'bg-red-50 text-red-700',
    }
    return colors[status] || 'bg-slate-50 text-slate-700'
}
