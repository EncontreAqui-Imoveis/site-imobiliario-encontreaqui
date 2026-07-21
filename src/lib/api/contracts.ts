import { apiClient, API_BASE_URL } from '@/lib/api/client'
import type {
    ContractDetail,
    ContractDocumentCategory,
    ContractDocumentCategoryStatus,
    ContractDocumentProgressSummary,
    ContractDocumentType,
    DocumentCategoryApplicability,
    ContractSummary,
    ContractSide,
    ContractApprovalReason,
    ContractCapabilities,
} from '@/types/contract'
import { isCancelledContractStatus } from '@/lib/contractsUi'

function parseCategoryStatus(raw: unknown): ContractDocumentCategoryStatus {
    const s = String(raw ?? 'PENDING').trim().toUpperCase()
    if (
        s === 'APPROVED' ||
        s === 'APPROVED_WITH_RES' ||
        s === 'REJECTED' ||
        s === 'NOT_APPLICABLE' ||
        s === 'PENDING'
    ) {
        return s
    }
    return 'PENDING'
}

export function normalizeDocumentRequirements(
    raw: unknown,
): ContractSummary['documentRequirements'] {
    if (!raw || typeof raw !== 'object') {
        return null
    }
    const o = raw as Record<string, unknown>
    const mapRow = (item: unknown) => {
        if (!item || typeof item !== 'object') {
            return null
        }
        const row = item as Record<string, unknown>
        return {
            category: String(row.category ?? '').trim() as ContractDocumentCategory,
            applicability: String(row.applicability ?? 'required').trim().toLowerCase() as DocumentCategoryApplicability,
            required: Boolean(row.required),
            reasonCode: String(row.reasonCode ?? '').trim(),
        }
    }
    const parseList = (key: 'seller' | 'buyer') => {
        const a = o[key]
        if (!Array.isArray(a)) {
            return []
        }
        return a
            .map(mapRow)
            .filter(
                (row): row is NonNullable<ReturnType<typeof mapRow>> => row !== null,
            )
    }
    const out = {
        seller: parseList('seller'),
        buyer: parseList('buyer'),
    }
    if (out.seller.length === 0 && out.buyer.length === 0) {
        return null
    }
    return out
}

function normalizeNumericIdList(raw: unknown): number[] | null {
    if (Array.isArray(raw)) {
        const ids = raw
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        return ids.length > 0 ? Array.from(new Set(ids)) : null
    }

    const normalized = String(raw ?? '').trim()
    if (!normalized) {
        return null
    }

    const ids = normalized
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)

    return ids.length > 0 ? Array.from(new Set(ids)) : null
}

function normalizeDocumentProgress(raw: unknown): ContractDocumentProgressSummary | null {
    if (!raw || typeof raw !== 'object') return null
    const root = raw as Record<string, unknown>
    const parseSide = (side: 'seller' | 'buyer') => {
        const sideRaw = root[side]
        if (!sideRaw || typeof sideRaw !== 'object') {
            return {
                side,
                categories: [],
                totals: { pending: 0, approved: 0, rejected: 0 },
            }
        }
        const sideObj = sideRaw as Record<string, unknown>
        const categoriesRaw = Array.isArray(sideObj.categories) ? sideObj.categories : []
        const categories = categoriesRaw
            .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map((item) => ({
                category: String(item.category ?? '').trim() as ContractDocumentCategory,
                status: parseCategoryStatus(item.status),
                uploadedCount: Number(item.uploadedCount ?? 0),
                required: Boolean(item.required),
                latestDocumentId: Number(item.latestDocumentId ?? 0) || null,
                latestUploadedAt: String(item.latestUploadedAt ?? '').trim() || null,
            }))
        const totalsObj = sideObj.totals && typeof sideObj.totals === 'object'
            ? sideObj.totals as Record<string, unknown>
            : {}
        return {
            side,
            categories,
            totals: {
                pending: Number(totalsObj.pending ?? 0),
                approved: Number(totalsObj.approved ?? 0),
                rejected: Number(totalsObj.rejected ?? 0),
            },
        }
    }
    return {
        seller: parseSide('seller'),
        buyer: parseSide('buyer'),
    }
}

function normalizeCapabilities(raw: unknown): ContractCapabilities | null {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Record<string, unknown>
    const canEditSeller = Boolean(item.canEditSeller ?? item.can_edit_seller)
    const canEditBuyer = Boolean(item.canEditBuyer ?? item.can_edit_buyer)
    const isReadOnly = Boolean(item.isReadOnly ?? item.is_read_only)
    return {
        canReadMeta: Boolean(item.canReadMeta ?? item.can_read_meta),
        canReadSeller: Boolean(item.canReadSeller ?? item.can_read_seller),
        canEditSeller,
        canReadBuyer: Boolean(item.canReadBuyer ?? item.can_read_buyer),
        canEditBuyer,
        canReadDocumentStatus: item.canReadDocumentStatus == null && item.can_read_document_status == null
            ? true
            : Boolean(item.canReadDocumentStatus ?? item.can_read_document_status),
        canReadDocumentFiles: item.canReadDocumentFiles == null && item.can_read_document_files == null
            ? true
            : Boolean(item.canReadDocumentFiles ?? item.can_read_document_files),
        canMutateDocuments: item.canMutateDocuments == null && item.can_mutate_documents == null
            ? !isReadOnly && (canEditSeller || canEditBuyer)
            : Boolean(item.canMutateDocuments ?? item.can_mutate_documents),
        isReadOnly,
    }
}

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
    const rawViewerSide = String(item.viewerSide ?? item.viewer_side ?? '')
        .trim()
        .toLowerCase()
    const viewerSide: ContractSummary['viewerSide'] =
        rawViewerSide === 'seller' || rawViewerSide === 'buyer'
            ? rawViewerSide
            : rawViewerSide === 'both' || rawViewerSide === 'none'
                ? rawViewerSide
                : null
    const responsibleUserIds = normalizeNumericIdList(
        item.responsibleUserIds ?? item.responsible_user_ids,
    )

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
        updatedAt: String(item.updatedAt ?? item.updated_at ?? '').trim() || undefined,
        propertyTitle: typeof item.propertyTitle === 'string'
            ? item.propertyTitle
            : typeof item.property_title === 'string'
                ? item.property_title
                : null,
        propertyCode: typeof item.propertyCode === 'string'
            ? item.propertyCode
            : typeof item.property_code === 'string'
                ? item.property_code
                : null,
        propertyPurpose: typeof item.propertyPurpose === 'string'
            ? item.propertyPurpose
            : typeof item.property_purpose === 'string'
                ? item.property_purpose
                : null,
        viewerSide,
        responsibleUserIds,
        documentProgress: normalizeDocumentProgress(item.documentProgress ?? item.document_progress),
        documentRequirements: normalizeDocumentRequirements(
            item.documentRequirements ?? item.document_requirements,
        ),
        capabilities: normalizeCapabilities(item.capabilities),
    }
}

export function normalizeContractDocument(raw: unknown) {
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
        documentCategory: (item.documentCategory ?? item.document_category ?? null) as ContractDocumentCategory | null,
        categoryStatus: parseCategoryStatus(
            item.categoryStatus ?? item.category_status ?? 'PENDING',
        ),
        reviewReason: String(item.reviewReason ?? item.review_reason ?? '').trim() || null,
        validationResult: item.validationResult && typeof item.validationResult === 'object'
            ? item.validationResult as Record<string, unknown>
            : item.validation_result && typeof item.validation_result === 'object'
                ? item.validation_result as Record<string, unknown>
                : null,
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
        sellerInfo: item.ownerInfo ?? item.owner_info ?? item.sellerInfo ?? item.seller_info,
        ownerInfo: item.ownerInfo ?? item.owner_info ?? item.sellerInfo ?? item.seller_info,
        buyerInfo: item.buyerInfo ?? item.buyer_info,
        commissionData: item.commissionData ?? item.commission_data,
        workflowMetadata:
            item.workflowMetadata && typeof item.workflowMetadata === 'object'
                ? item.workflowMetadata as Record<string, unknown>
                : item.workflow_metadata && typeof item.workflow_metadata === 'object'
                    ? item.workflow_metadata as Record<string, unknown>
                    : null,
        sellerApprovalReason:
            item.ownerApprovalReason && typeof item.ownerApprovalReason === 'object'
                ? item.ownerApprovalReason as ContractApprovalReason
                : item.owner_approval_reason && typeof item.owner_approval_reason === 'object'
                    ? item.owner_approval_reason as ContractApprovalReason
                    : item.sellerApprovalReason && typeof item.sellerApprovalReason === 'object'
                        ? item.sellerApprovalReason as ContractApprovalReason
                        : item.seller_approval_reason && typeof item.seller_approval_reason === 'object'
                            ? item.seller_approval_reason as ContractApprovalReason
                            : null,
        ownerApprovalReason:
            item.ownerApprovalReason && typeof item.ownerApprovalReason === 'object'
                ? item.ownerApprovalReason as ContractApprovalReason
                : item.owner_approval_reason && typeof item.owner_approval_reason === 'object'
                    ? item.owner_approval_reason as ContractApprovalReason
                    : item.sellerApprovalReason && typeof item.sellerApprovalReason === 'object'
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
        buyerClientId:
            typeof item.buyerClientId === 'number'
                ? item.buyerClientId
                : typeof item.buyer_client_id === 'number'
                    ? item.buyer_client_id
                    : null,
        ownerId:
            typeof item.ownerId === 'number'
                ? item.ownerId
                : typeof item.property_owner_id === 'number'
                    ? item.property_owner_id
                    : null,
        ownerName:
            typeof item.ownerName === 'string'
                ? item.ownerName
                : typeof item.property_owner_name === 'string'
                    ? item.property_owner_name
                    : null,
        capturingBrokerName:
            typeof item.capturingBrokerName === 'string'
                ? item.capturingBrokerName
                : typeof item.capturing_broker_name === 'string'
                    ? item.capturing_broker_name
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
        .filter((item) => !isCancelledContractStatus(item.status))
}

export async function getContractById(id: string): Promise<ContractDetail> {
    const response = await apiClient.get<unknown>(`/contracts/${encodeURIComponent(id)}`)
    return normalizeContractDetail(response)
}

export async function uploadContractDocument(options: {
    contractId: string
    documentType: ContractDocumentType
    documentCategory?: ContractDocumentCategory
    side?: ContractSide
    file: File
}): Promise<void> {
    const formData = new FormData()
    formData.append('file', options.file)
    const normalizedDocumentType =
        options.documentType === 'cliente_outros' ? 'cliente_outro_01' : options.documentType
    formData.append('documentType', normalizedDocumentType)
    if (options.documentCategory) {
        formData.append('documentCategory', options.documentCategory)
    }
    if (options.side) {
        formData.append('side', options.side)
    }

    await apiClient.post(`/contracts/${encodeURIComponent(options.contractId)}/documents`, formData)
}

export async function setContractSignatureMethod(
    contractId: string,
    method: 'in_person',
): Promise<void> {
    await apiClient.post(`/contracts/${encodeURIComponent(contractId)}/signature-method`, {
        method,
    })
}

export async function deleteContractDocument(contractId: string, documentId: number): Promise<void> {
    await apiClient.delete(
        `/contracts/${encodeURIComponent(contractId)}/documents/${encodeURIComponent(String(documentId))}`,
    )
}

export async function updateContractData(options: {
    contractId: string
    side: ContractSide
    sellerInfo?: Record<string, unknown>
    buyerInfo?: Record<string, unknown>
}): Promise<void> {
    const payload: Record<string, unknown> = { side: options.side }
    if (options.sellerInfo && Object.keys(options.sellerInfo).length > 0) {
        payload.sellerInfo = options.sellerInfo
    }
    if (options.buyerInfo && Object.keys(options.buyerInfo).length > 0) {
        payload.buyerInfo = options.buyerInfo
    }
    await apiClient.put(`/contracts/${encodeURIComponent(options.contractId)}/data`, payload)
}

export function buildNegotiationDocumentDownloadUrl(negotiationId: string, documentId: number): string {
    return `${API_BASE_URL}/negotiations/${encodeURIComponent(
        negotiationId,
    )}/documents/${encodeURIComponent(String(documentId))}/download`
}
