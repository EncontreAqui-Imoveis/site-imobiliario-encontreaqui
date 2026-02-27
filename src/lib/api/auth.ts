import { apiClient, ApiError } from '@/lib/api/client'
import type { Broker, BrokerDocuments, User } from '@/types/user'

export interface UserSession {
    user: User
    isBroker: boolean
    broker?: Broker
    brokerDocuments?: BrokerDocuments
    profileStatus: 'incomplete' | 'complete'
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
    state?: string
}

export async function fetchCurrentSession(): Promise<UserSession | null> {
    try {
        return await apiClient.get<UserSession>('/me')
    } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            return null
        }
        throw error
    }
}

export async function login(payload: LoginPayload): Promise<UserSession> {
    return apiClient.post<UserSession>('/auth/login', payload)
}

export async function register(payload: RegisterPayload): Promise<UserSession> {
    return apiClient.post<UserSession>('/auth/register', payload)
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post('/auth/logout', undefined, { skipThrowOnError: true })
    } catch {
        // Logout deve ser resiliente a falhas.
    }
}

