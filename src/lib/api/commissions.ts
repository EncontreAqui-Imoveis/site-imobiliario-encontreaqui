import { apiClient } from './client'

export interface CommissionRecord {
    id: string
    negotiationId: string
    brokerId: number
    role: 'CAPTURING' | 'SELLING'
    amount: number
    status: 'PENDING' | 'PAID' | 'CANCELLED'
    paidAt?: string
    createdAt: string
}

export interface VGVSummary {
    month: string
    year: number
    totalSales: number
    totalRentals: number
    totalCommissions: number
    splits: {
        captador: number
        vendedor: number
        plataforma: number
    }
}

export async function getVGVSummary(month?: number, year?: number): Promise<VGVSummary[]> {
    const params = new URLSearchParams()
    if (month) params.set('month', String(month))
    if (year) params.set('year', String(year))
    const qs = params.toString()
    return apiClient.get<VGVSummary[]>(`/admin/commissions/vgv${qs ? `?${qs}` : ''}`)
}

export async function getCommissionsByBroker(brokerId: number): Promise<CommissionRecord[]> {
    return apiClient.get<CommissionRecord[]>(`/admin/commissions/broker/${brokerId}`)
}

export async function getMyBrokerCommissions(): Promise<CommissionRecord[]> {
    return apiClient.get<CommissionRecord[]>('/broker/commissions')
}
