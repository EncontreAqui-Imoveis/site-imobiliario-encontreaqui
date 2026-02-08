export interface User {
    id: number
    name: string
    email: string
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
    status: 'pending_verification' | 'approved' | 'rejected'
    agencyId?: number
}

export interface BrokerDocuments {
    brokerId: number
    creciFrontUrl: string
    creciBackUrl: string
    selfieUrl: string
    status: 'pending' | 'approved' | 'rejected'
}
