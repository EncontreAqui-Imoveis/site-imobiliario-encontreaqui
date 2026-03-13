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
    const response = await apiClient.get<{
        data?: CommissionSummary[]
    } | CommissionSummary[]>('/brokers/me/commissions')

    return Array.isArray(response) ? response : (response?.data ?? [])
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
    const response = await apiClient.get<{
        data?: Record<string, unknown>
    } | Record<string, unknown>>('/brokers/me/performance-report')

    const data = (Array.isArray(response) ? {} : response?.data ?? response) as Record<string, unknown>

    return {
        totalSales: Number(data.totalSales ?? 0),
        totalRentals: Number(data.totalRents ?? data.totalRentals ?? 0),
        totalCommissionEarned: Number(data.totalCommission ?? data.totalCommissionEarned ?? 0),
        totalPropertiesListed: Number(data.totalProperties ?? data.totalPropertiesListed ?? 0),
        activeNegotiations: Number(data.activeNegotiations ?? 0),
        statusBreakdown: (data.statusBreakdown as Record<string, number> | undefined) ?? {},
        monthlyBreakdown: Array.isArray(data.monthlyBreakdown)
            ? (data.monthlyBreakdown as PerformanceReport['monthlyBreakdown'])
            : [],
    }
}
