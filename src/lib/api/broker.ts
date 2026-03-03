import { apiClient } from '@/lib/api/client'

export interface BrokerRegistrationPayload {
    creci: string
}

export async function requestBrokerUpgrade(payload: BrokerRegistrationPayload): Promise<void> {
    await apiClient.post('/brokers/me/request-upgrade', payload)
}

export async function uploadBrokerDocuments(files: {
    creciFront: File
    creciBack: File
    selfie: File
}): Promise<void> {
    const formData = new FormData()
    formData.append('creciFront', files.creciFront)
    formData.append('creciBack', files.creciBack)
    formData.append('selfie', files.selfie)

    await apiClient.post('/brokers/me/verify-documents', formData)
}

export interface CommissionSummary {
    role: 'CAPTURING' | 'SELLING'
    amount: number
    status: 'PENDING' | 'PAID' | 'CANCELLED'
    negotiationId: string
    propertyTitle?: string
    dealType?: string
    salePrice?: number
    commissionRate?: number
    commissionCycles?: number
    commissionAmountTotal?: number
    recurrenceInterval?: string
    condominioValue?: number
    saleDate?: string
    isRecurring?: boolean
}

export async function getMyCommissions(): Promise<CommissionSummary[]> {
    return apiClient.get<CommissionSummary[]>('/brokers/me/commissions')
}

export interface PerformanceReport {
    totalSales: number
    totalRentals: number
    totalCommissionEarned: number
    totalPropertiesListed: number
    activeNegotiations: number
    statusBreakdown?: Record<string, number>
    monthlyBreakdown: Array<{
        month: string
        sales: number
        rentals: number
        commissions: number
    }>
}

export async function getMyPerformanceReport(): Promise<PerformanceReport> {
    return apiClient.get<PerformanceReport>('/brokers/me/performance-report')
}
