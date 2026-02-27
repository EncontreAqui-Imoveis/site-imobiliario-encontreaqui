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

export interface ContractDocument {
    id: number
    negotiationId: string
    type: 'proposal' | 'contract' | 'other'
    documentType: ContractDocumentType | null
    side?: ContractSide
    originalFileName?: string
    createdAt: string
}

export interface ContractSummary {
    id: string
    negotiationId: string
    propertyId: number
    status: ContractStatus
    sellerApprovalStatus: ApprovalStatus
    buyerApprovalStatus: ApprovalStatus
    createdAt: string
}

export interface ContractDetail extends ContractSummary {
    sellerInfo?: unknown
    buyerInfo?: unknown
    commissionData?: unknown
    documents: ContractDocument[]
}

export type CommissionRole = 'CAPTURING' | 'SELLING'

export type CommissionStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface Commission {
    id: string
    negotiationId: string
    brokerId: number
    role: CommissionRole
    amount: number
    status: CommissionStatus
    createdAt: string
}


