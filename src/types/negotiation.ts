export type NegotiationStatus =
    | 'PROPOSAL_DRAFT'
    | 'PENDING_PROPOSAL'
    | 'PROPOSAL_SENT'
    | 'PROPOSAL_SIGNED'
    | 'PROPOSAL_REJECTED'
    | 'PROPOSAL_DECLINED'
    | 'PROPOSAL_REFUSED'
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
    buyerUserId?: number | null
    buyerName?: string | null
    createdAt: string
    updatedAt: string
    proposalValidUntil?: string
    canEditProposal?: boolean
    secondsUntilEditAllowed?: number
    hasSignedProposal?: boolean
    validadeDias?: number
    proposalValue?: number | null
    paymentBreakdown?: {
        dinheiro: number
        permuta: number
        financiamento: number
        outros: number
    } | null
    propertyBrokerId?: number | null
    sellerBrokerId?: number | null
    contractId?: string
    contractStatus?: string
    buyerApprovalStatus?: string
    sellerApprovalStatus?: string
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

export type ProposalBucket = 'sent' | 'signed' | 'refused' | 'other'

const REFUSED_STATUSES = new Set<string>([
    'CANCELLED',
    'PROPOSAL_REJECTED',
    'PROPOSAL_DECLINED',
    'PROPOSAL_REFUSED',
    'PROPOSAL_DENIED',
    'PROPOSAL_RECUSED',
])

const SENT_STATUSES = new Set<string>([
    'PROPOSAL_DRAFT',
    'PENDING_PROPOSAL',
    'PROPOSAL_SENT',
])

const SIGNED_STATUSES = new Set<string>([
    'PROPOSAL_SIGNED',
    'DOCUMENTATION_PHASE',
    'CONTRACT_DRAFTING',
    'AWAITING_SIGNATURES',
    'IN_NEGOTIATION',
    'IN_CONTRACT',
    'CONTRACT_FINALIZED',
    'SOLD',
    'RENTED',
])

function normalizeStatus(status: string): string {
    return String(status ?? '').trim().toUpperCase()
}

export function isProposalRefusedStatus(status: string): boolean {
    const normalized = normalizeStatus(status)
    if (REFUSED_STATUSES.has(normalized)) return true
    return normalized.includes('REJECT') || normalized.includes('DECLIN') || normalized.includes('REFUS')
}

export function isProposalPreSignatureStatus(status: string): boolean {
    const normalized = normalizeStatus(status)
    return SENT_STATUSES.has(normalized)
}

export function isProposalSignedOrBeyondStatus(status: string): boolean {
    const normalized = normalizeStatus(status)
    return SIGNED_STATUSES.has(normalized)
}

export function resolveProposalBucket(status: string): ProposalBucket {
    if (isProposalRefusedStatus(status)) return 'refused'
    if (isProposalPreSignatureStatus(status)) return 'sent'
    if (isProposalSignedOrBeyondStatus(status)) return 'signed'
    return 'other'
}

export function getStatusLabel(status: NegotiationStatus): string {
    const labels: Record<NegotiationStatus, string> = {
        PROPOSAL_DRAFT: 'Proposta em Rascunho',
        PENDING_PROPOSAL: 'Proposta Pendente',
        PROPOSAL_SENT: 'Proposta Enviada',
        PROPOSAL_SIGNED: 'Proposta Assinada',
        PROPOSAL_REJECTED: 'Proposta Recusada',
        PROPOSAL_DECLINED: 'Proposta Recusada',
        PROPOSAL_REFUSED: 'Proposta Recusada',
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
        PROPOSAL_DRAFT: 'bg-amber-50 text-amber-700',
        PENDING_PROPOSAL: 'bg-amber-50 text-amber-700',
        PROPOSAL_SENT: 'bg-blue-50 text-blue-700',
        PROPOSAL_SIGNED: 'bg-indigo-50 text-indigo-700',
        PROPOSAL_REJECTED: 'bg-red-50 text-red-700',
        PROPOSAL_DECLINED: 'bg-red-50 text-red-700',
        PROPOSAL_REFUSED: 'bg-red-50 text-red-700',
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
