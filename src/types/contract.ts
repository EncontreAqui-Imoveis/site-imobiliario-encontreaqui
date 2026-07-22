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

export type ContractDealType = 'sale' | 'rent'

export type ContractHandshakeStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface ContractCapabilities {
    canReadMeta: boolean
    canReadSeller: boolean
    canEditSeller: boolean
    canReadBuyer: boolean
    canEditBuyer: boolean
    canReadDocumentStatus: boolean
    canReadDocumentFiles: boolean
    canMutateDocuments: boolean
    isReadOnly: boolean
    requiresHandshakeVerification?: boolean
}
export type ContractDocumentCategoryStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'APPROVED_WITH_RES'
    | 'REJECTED'
    | 'NOT_APPLICABLE'

export type DocumentCategoryApplicability = 'required' | 'optional' | 'not_applicable'

export interface DocumentCategoryRequirement {
    category: ContractDocumentCategory
    applicability: DocumentCategoryApplicability
    required: boolean
    reasonCode: string
}

export interface DocumentRequirementsPayload {
    seller: DocumentCategoryRequirement[]
    buyer: DocumentCategoryRequirement[]
}
export type ContractDocumentCategory =
    | 'identidade'
    | 'comprovante_endereco'
    | 'estado_civil'
    | 'conjuge_documentos'
    | 'comprovante_renda'
    | 'seguro_incendio'
    | 'dados_bancarios'
    | 'certidao_inteiro_teor_escritura'
    | 'certidao_onus_acoes'
    | 'outro'

export type ContractDocumentType =
    | 'doc_identidade'
    | 'doc_identidade_conjuge'
    | 'comprovante_endereco'
    | 'certidao_casamento_nascimento'
    | 'certidao_inteiro_teor'
    | 'certidao_onus_acoes'
    | 'comprovante_renda'
    | 'seguro_incendio'
    | 'dados_bancarios'
    | 'contrato_minuta'
    | 'contrato_assinado'
    | 'comprovante_pagamento'
    | 'boleto_vistoria'
    | 'outro'
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
    documentCategory?: ContractDocumentCategory | null
    categoryStatus?: ContractDocumentCategoryStatus
    reviewReason?: string | null
    validationResult?: Record<string, unknown> | null
    originalFileName?: string
    createdAt: string
}

export interface ContractDocumentCategoryProgress {
    category: ContractDocumentCategory
    status: ContractDocumentCategoryStatus
    uploadedCount: number
    required: boolean
    latestDocumentId: number | null
    latestUploadedAt: string | null
}

export interface ContractDocumentProgressSide {
    side: ContractSide
    categories: ContractDocumentCategoryProgress[]
    totals: {
        pending: number
        approved: number
        rejected: number
    }
}

export interface ContractDocumentProgressSummary {
    seller: ContractDocumentProgressSide
    buyer: ContractDocumentProgressSide
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
    dealType?: ContractDealType | null
    viewerSide?: ContractSide | 'both' | 'none' | null
    responsibleUserIds?: number[] | null
    documentProgress?: ContractDocumentProgressSummary | null
    documentRequirements?: DocumentRequirementsPayload | null
    capabilities?: ContractCapabilities | null
    workflow?: {
        status: ContractStatus
        isReadOnly: boolean
    } | null
    handshake?: {
        status: ContractHandshakeStatus | null
        requiresVerification: boolean
    } | null
}

export interface ContractDetail extends ContractSummary {
    sellerInfo?: unknown
    ownerInfo?: unknown
    buyerInfo?: unknown
    commissionData?: unknown
    workflowMetadata?: Record<string, unknown> | null
    identityCapabilities?: {
        seller: { canEditName: boolean; canEditCpf: boolean }
        buyer: { canEditName: boolean; canEditCpf: boolean }
    } | null
    sellerApprovalReason?: ContractApprovalReason | null
    ownerApprovalReason?: ContractApprovalReason | null
    buyerApprovalReason?: ContractApprovalReason | null
    capturingBrokerId?: number | null
    buyerClientId?: number | null
    ownerId?: number | null
    ownerName?: string | null
    capturingBrokerName?: string | null
    agencyName?: string | null
    agencyAddress?: string | null
    documents: ContractDocument[]
}

