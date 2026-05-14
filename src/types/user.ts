export interface User {
    id: number
    name: string
    email: string
    role?: 'client' | 'broker' | 'auxiliary_administrative'
    broker_status?: 'pending_verification' | 'pending_documents' | 'approved' | 'rejected' | null
    email_verified?: boolean
    email_verified_at?: string | null
    phone?: string
    address?: string
    city?: string
    state?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    cep?: string
    createdAt: string
}

export interface Broker extends User {
    creci: string
    status: 'pending_verification' | 'pending_documents' | 'approved' | 'rejected'
    agencyId?: number
}

export interface BrokerDocuments {
    brokerId: number
    creciFrontUrl: string
    creciBackUrl: string
    selfieUrl: string
    status: 'pending' | 'approved' | 'rejected'
}
