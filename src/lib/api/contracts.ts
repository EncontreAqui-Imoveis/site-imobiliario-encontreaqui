import { apiClient, API_BASE_URL } from '@/lib/api/client'
import type {
    ContractDetail,
    ContractSummary,
    ContractDocumentType,
    ContractSide,
    Commission,
    ContractApprovalReason,
} from '@/types/contract'

function normalizeContractSummary(raw: unknown): ContractSummary | null {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Record<string, unknown>
    const id = String(item.id ?? '').trim()
    const negotiationId = String(item.negotiationId ?? item.negotiation_id ?? '').trim()
    const propertyId = Number(item.propertyId ?? item.property_id ?? 0)
    const status = String(item.status ?? '').trim() as ContractSummary['status']
    const sellerApprovalStatus = String(
        item.sellerApprovalStatus ?? item.seller_approval_status ?? 'PENDING'
    ).trim() as ContractSummary['sellerApprovalStatus']
    const buyerApprovalStatus = String(
        item.buyerApprovalStatus ?? item.buyer_approval_status ?? 'PENDING'
    ).trim() as ContractSummary['buyerApprovalStatus']
    const createdAt = String(item.createdAt ?? item.created_at ?? '').trim()

    if (!id || !negotiationId || !Number.isFinite(propertyId) || propertyId <= 0) {
        return null
    }

    return {
        id,
        negotiationId,
        propertyId,
        status,
        sellerApprovalStatus,
        buyerApprovalStatus,
        createdAt,
    }
}

function normalizeContractDocument(raw: unknown) {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Record<string, unknown>
    const id = Number(item.id ?? 0)
    const negotiationId = String(item.negotiationId ?? item.negotiation_id ?? '').trim()
    const createdAt = String(item.createdAt ?? item.created_at ?? '').trim()
    if (!Number.isFinite(id) || id <= 0 || !negotiationId) {
        return null
    }
    return {
        id,
        negotiationId,
        type: (String(item.type ?? 'other').trim() || 'other') as ContractDetail['documents'][number]['type'],
        documentType: (item.documentType ?? item.document_type ?? null) as ContractDocumentType | null,
        side: (item.side ?? undefined) as 'seller' | 'buyer' | undefined,
        originalFileName: typeof item.originalFileName === 'string'
            ? item.originalFileName
            : typeof item.original_file_name === 'string'
                ? item.original_file_name
                : undefined,
        createdAt,
    }
}

function normalizeContractDetail(raw: unknown): ContractDetail {
    const root = (raw && typeof raw === 'object' && 'contract' in (raw as Record<string, unknown>))
        ? raw as Record<string, unknown>
        : null
    const summary = normalizeContractSummary(root?.contract ?? raw)
    if (!summary) {
        throw new Error('Contrato inválido.')
    }
    const item = (root?.contract ?? raw) as Record<string, unknown>
    const documentsRaw = Array.isArray(root?.documents)
        ? root!.documents
        : Array.isArray(item.documents)
            ? item.documents
            : []
    const documents = documentsRaw
        .map((document) => normalizeContractDocument(document))
        .filter((document): document is NonNullable<ReturnType<typeof normalizeContractDocument>> => document !== null)
    return {
        ...summary,
        sellerInfo: item.sellerInfo ?? item.seller_info,
        buyerInfo: item.buyerInfo ?? item.buyer_info,
        commissionData: item.commissionData ?? item.commission_data,
        workflowMetadata:
            item.workflowMetadata && typeof item.workflowMetadata === 'object'
                ? item.workflowMetadata as Record<string, unknown>
                : item.workflow_metadata && typeof item.workflow_metadata === 'object'
                    ? item.workflow_metadata as Record<string, unknown>
                    : null,
        sellerApprovalReason:
            item.sellerApprovalReason && typeof item.sellerApprovalReason === 'object'
                ? item.sellerApprovalReason as ContractApprovalReason
                : item.seller_approval_reason && typeof item.seller_approval_reason === 'object'
                    ? item.seller_approval_reason as ContractApprovalReason
                    : null,
        buyerApprovalReason:
            item.buyerApprovalReason && typeof item.buyerApprovalReason === 'object'
                ? item.buyerApprovalReason as ContractApprovalReason
                : item.buyer_approval_reason && typeof item.buyer_approval_reason === 'object'
                    ? item.buyer_approval_reason as ContractApprovalReason
                    : null,
        capturingBrokerId:
            typeof item.capturingBrokerId === 'number'
                ? item.capturingBrokerId
                : typeof item.capturing_broker_id === 'number'
                    ? item.capturing_broker_id
                    : null,
        sellingBrokerId:
            typeof item.sellingBrokerId === 'number'
                ? item.sellingBrokerId
                : typeof item.selling_broker_id === 'number'
                    ? item.selling_broker_id
                    : null,
        capturingBrokerName:
            typeof item.capturingBrokerName === 'string'
                ? item.capturingBrokerName
                : typeof item.capturing_broker_name === 'string'
                    ? item.capturing_broker_name
                    : null,
        sellingBrokerName:
            typeof item.sellingBrokerName === 'string'
                ? item.sellingBrokerName
                : typeof item.selling_broker_name === 'string'
                    ? item.selling_broker_name
                    : null,
        agencyName:
            typeof item.agencyName === 'string'
                ? item.agencyName
                : typeof item.agency_name === 'string'
                    ? item.agency_name
                    : null,
        agencyAddress:
            typeof item.agencyAddress === 'string'
                ? item.agencyAddress
                : typeof item.agency_address === 'string'
                    ? item.agency_address
                    : null,
        documents,
    }
}

export async function getMyContracts(): Promise<ContractSummary[]> {
    const response = await apiClient.get<{
        data?: ContractSummary[]
    } | ContractSummary[]>('/contracts/me')

    const rows = Array.isArray(response) ? response : (response?.data ?? [])
    return rows
        .map((item) => normalizeContractSummary(item))
        .filter((item): item is ContractSummary => item !== null)
}

export async function getContractById(id: string): Promise<ContractDetail> {
    const response = await apiClient.get<unknown>(`/contracts/${encodeURIComponent(id)}`)
    return normalizeContractDetail(response)
}

export async function uploadContractDocument(options: {
    contractId: string
    documentType: ContractDocumentType
    side: ContractSide
    file: File
}): Promise<void> {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('documentType', options.documentType)
    formData.append('side', options.side)

    await apiClient.post(`/contracts/${encodeURIComponent(options.contractId)}/documents`, formData)
}

export async function deleteContractDocument(contractId: string, documentId: number): Promise<void> {
    await apiClient.delete(
        `/contracts/${encodeURIComponent(contractId)}/documents/${encodeURIComponent(String(documentId))}`,
    )
}

export function buildNegotiationDocumentDownloadUrl(negotiationId: string, documentId: number): string {
    return `${API_BASE_URL}/negotiations/${encodeURIComponent(
        negotiationId,
    )}/documents/${encodeURIComponent(String(documentId))}/download`
}

export async function getNegotiationCommissions(negotiationId: string): Promise<Commission[]> {
    return apiClient.get<Commission[]>(
        `/negotiations/${encodeURIComponent(negotiationId)}/commissions`,
    )
}


