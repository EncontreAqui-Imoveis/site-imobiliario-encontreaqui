export type ContractStatus =
    | 'AWAITING_DOCS'
    | 'IN_DRAFT'
    | 'AWAITING_SIGNATURES'
    | 'FINALIZED'

export type ApprovalStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'APPROVED_WITH_RES'
    | 'REJECTED'

export type ContractSide = 'seller' | 'buyer'

export type ContractDocumentType =
    | 'doc_identidade'
    | 'comprovante_endereco'
    | 'certidao_casamento_nascimento'
    | 'certidao_inteiro_teor'
    | 'certidao_onus_acoes'
    | 'comprovante_renda'
    | 'contrato_minuta'
    | 'contrato_assinado'
    | 'comprovante_pagamento'
    | 'boleto_vistoria'
    | 'cliente_cnh'
    | 'cliente_identidade'
    | 'cliente_cpf'
    | 'cliente_outros'

export interface ContractDocument {
    id: number
    negotiationId: string
    type: 'proposal' | 'contract' | 'other'
    documentType: ContractDocumentType | null
    side?: ContractSide
    originalFileName?: string
    createdAt: string
}

export interface ContractApprovalReason {
    reason?: string | null
    details?: string | null
    [key: string]: unknown
}

export interface ContractSummary {
    id: string
    negotiationId: string
    propertyId: number
    status: ContractStatus
    sellerApprovalStatus: ApprovalStatus
    buyerApprovalStatus: ApprovalStatus
    createdAt: string
    updatedAt?: string
    propertyTitle?: string | null
    propertyCode?: string | null
    propertyPurpose?: string | null
}

export interface ContractDetail extends ContractSummary {
    sellerInfo?: unknown
    buyerInfo?: unknown
    commissionData?: unknown
    workflowMetadata?: Record<string, unknown> | null
    sellerApprovalReason?: ContractApprovalReason | null
    buyerApprovalReason?: ContractApprovalReason | null
    capturingBrokerId?: number | null
    sellingBrokerId?: number | null
    capturingBrokerName?: string | null
    sellingBrokerName?: string | null
    agencyName?: string | null
    agencyAddress?: string | null
    documents: ContractDocument[]
}

