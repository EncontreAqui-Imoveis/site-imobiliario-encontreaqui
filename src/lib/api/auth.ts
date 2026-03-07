import { apiClient, ApiError } from '@/lib/api/client'
import type { Broker, BrokerDocuments, User } from '@/types/user'

export interface UserSession {
    user: User
    isBroker: boolean
    broker?: Broker
    brokerDocuments?: BrokerDocuments
    profileStatus: 'incomplete' | 'complete'
}

export interface EmailSendResult {
    delivery: string
    expires_at?: string | null
    cooldown_sec?: number
    daily_remaining?: number
}

export interface PasswordResetVerifyResult {
    reset_session_token: string
    expires_at: string
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
    street?: string
    number?: string
    complement?: string
    bairro?: string
    cep?: string
}

export async function fetchCurrentSession(): Promise<UserSession | null> {
    try {
        return await apiClient.get<UserSession>('/auth/me')
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

export async function loginWithGoogle(idToken: string): Promise<UserSession> {
    return apiClient.post<UserSession>('/auth/google', { idToken })
}

export async function requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request', { email })
}

export async function sendEmailVerificationCode(email: string): Promise<EmailSendResult> {
    return apiClient.post<EmailSendResult>('/auth/email-verification/send', { email })
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
    await apiClient.post('/auth/email-verification/verify-code', { email, code })
}

export async function verifyPasswordResetCode(
    email: string,
    code: string,
): Promise<PasswordResetVerifyResult> {
    return apiClient.post<PasswordResetVerifyResult>('/auth/password-reset/verify-code', {
        email,
        code,
    })
}

export async function confirmPasswordReset(
    email: string,
    resetSessionToken: string,
    newPassword: string,
): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm', {
        email,
        reset_session_token: resetSessionToken,
        new_password: newPassword,
    })
}

export async function checkEmail(email: string): Promise<{
    exists: boolean
    hasFirebaseUid?: boolean
    hasPassword?: boolean
}> {
    return apiClient.get<{
        exists: boolean
        hasFirebaseUid?: boolean
        hasPassword?: boolean
    }>(`/auth/check-email?email=${encodeURIComponent(email)}`)
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post('/auth/logout', undefined, { skipThrowOnError: true })
    } catch {
        // Logout deve ser resiliente a falhas.
    }
}

