import { apiClient, ApiError } from '@/lib/api/client'
import { clearAuthToken, persistAuthToken } from '@/lib/auth/tokenStore'
import type { Broker, BrokerDocuments, User } from '@/types/user'

export interface UserSession {
    user: User
    isBroker: boolean
    broker?: Broker
    brokerDocuments?: BrokerDocuments
    profileStatus: 'incomplete' | 'complete'
}

type AuthResponse = {
    user: User
    token?: string
    needsCompletion?: boolean
    requiresDocuments?: boolean
    broker?: Broker
}

type ProfileResponse = {
    role?: 'client' | 'broker'
    status?: 'pending_verification' | 'approved' | 'rejected'
    requiresDocuments?: boolean
    user: User
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

function isProfileComplete(user: User): boolean {
    return Boolean(
        user.phone &&
        user.street &&
        user.number &&
        user.bairro &&
        user.city &&
        user.state &&
        user.cep,
    )
}

function mapAuthResponseToSession(response: AuthResponse): UserSession {
    return {
        user: response.user,
        isBroker: response.user.role === 'broker' || response.broker?.status != null,
        broker: response.broker,
        profileStatus:
            response.needsCompletion === true || !isProfileComplete(response.user)
                ? 'incomplete'
                : 'complete',
    }
}

function mapProfileResponseToSession(response: ProfileResponse): UserSession {
    const isBroker = response.role === 'broker'
    const broker =
        isBroker
            ? {
                  ...(response.user as unknown as Broker),
                  creci: (response.user as unknown as Broker).creci ?? '',
                  status: response.status ?? 'pending_verification',
              }
            : undefined

    return {
        user: {
            ...response.user,
            role: response.role ?? 'client',
            broker_status: response.status ?? null,
        } as User,
        isBroker,
        broker,
        profileStatus: isProfileComplete(response.user) ? 'complete' : 'incomplete',
    }
}

export async function fetchCurrentSession(): Promise<UserSession | null> {
    try {
        const response = await apiClient.get<ProfileResponse>('/users/me')
        return mapProfileResponseToSession(response)
    } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            clearAuthToken()
            return null
        }
        throw error
    }
}

export async function login(payload: LoginPayload): Promise<UserSession> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    if (response.token) {
        persistAuthToken(response.token)
    }
    return mapAuthResponseToSession(response)
}

export async function register(payload: RegisterPayload): Promise<UserSession> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload)
    if (response.token) {
        persistAuthToken(response.token)
    }
    return mapAuthResponseToSession(response)
}

export async function loginWithGoogle(idToken: string): Promise<UserSession> {
    const response = await apiClient.post<AuthResponse>('/auth/google', { idToken })
    if (response.token) {
        persistAuthToken(response.token)
    }
    return mapAuthResponseToSession(response)
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
    } finally {
        clearAuthToken()
    }
}

