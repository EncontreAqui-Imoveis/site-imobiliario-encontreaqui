import { apiClient, API_BASE_URL } from '@/lib/api/client'
import type {
    ContractDetail,
    ContractSummary,
    ContractDocumentType,
    ContractSide,
    Commission,
} from '@/types/contract'

export async function getMyContracts(): Promise<ContractSummary[]> {
    const response = await apiClient.get<{
        data?: ContractSummary[]
    } | ContractSummary[]>('/contracts/me')

    return Array.isArray(response) ? response : (response?.data ?? [])
}

export async function getContractById(id: string): Promise<ContractDetail> {
    return apiClient.get<ContractDetail>(`/contracts/${encodeURIComponent(id)}`)
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


