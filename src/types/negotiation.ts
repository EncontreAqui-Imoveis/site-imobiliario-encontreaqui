export type NegotiationStatus =
    | 'PENDING_PROPOSAL'
    | 'PROPOSAL_SENT'
    | 'PROPOSAL_SIGNED'
    | 'IN_CONTRACT'
    | 'CONTRACT_FINALIZED'
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
        CONTRACT_FINALIZED: 'bg-emerald-50 text-emerald-700',
        SOLD: 'bg-green-50 text-green-700',
        RENTED: 'bg-teal-50 text-teal-700',
        CANCELLED: 'bg-red-50 text-red-700',
    }
    return colors[status] || 'bg-slate-50 text-slate-700'
}
