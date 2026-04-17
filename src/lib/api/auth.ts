import { apiClient, ApiError } from '@/lib/api/client'
import {
    clearAuthToken,
    hasAuthTokenInBrowser,
    hasAuthTokenInServer,
    persistAuthToken,
} from '@/lib/auth/tokenStore'
import type { Broker, BrokerDocuments, User } from '@/types/user'

export interface UserSession {
    user: User
    isBroker: boolean
    broker?: Broker
    brokerDocuments?: BrokerDocuments
    profileStatus: 'incomplete' | 'complete'
    requiresBrokerDocuments?: boolean
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

type GooglePendingResponse = {
    isNewUser?: boolean
    requiresProfileChoice?: boolean
    pending?: {
        email?: string
        name?: string
        googleUid?: string
    }
    roleLocked?: boolean
    needsCompletion?: boolean
    requiresDocuments?: boolean
    requestedProfile?: 'auto' | 'client' | 'broker'
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

export interface PhoneOtpIssueResult {
    sessionToken: string
    expiresAt: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    name: string
    email: string
    password: string
    profileType?: 'client' | 'broker'
    creci?: string
    googleIdToken?: string
    phone?: string
    city?: string
    state?: string
    street?: string
    number?: string
    withoutNumber?: boolean
    complement?: string
    bairro?: string
    cep?: string
}

export interface GooglePendingAuthResult {
    kind: 'google_pending'
    isNewUser: boolean
    requiresProfileChoice: boolean
    roleLocked: boolean
    needsCompletion: boolean
    requiresDocuments: boolean
    requestedProfile: 'auto' | 'client' | 'broker'
    pending: {
        email: string
        name: string
        googleUid: string
        googleIdToken: string
    }
}

export type GoogleAuthResult = UserSession | GooglePendingAuthResult

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
        requiresBrokerDocuments: response.requiresDocuments === true,
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
        requiresBrokerDocuments: response.requiresDocuments === true,
        profileStatus: isProfileComplete(response.user) ? 'complete' : 'incomplete',
    }
}

function isGooglePendingResponse(response: unknown): response is GooglePendingResponse {
    if (!response || typeof response !== 'object') return false
    const value = response as GooglePendingResponse
    return value.requiresProfileChoice === true || value.isNewUser === true || value.pending != null
}

function mapGooglePendingResponse(
    response: GooglePendingResponse,
    googleIdToken: string,
): GooglePendingAuthResult {
    const pending = response.pending ?? {}

    return {
        kind: 'google_pending',
        isNewUser: response.isNewUser === true,
        requiresProfileChoice: response.requiresProfileChoice === true,
        roleLocked: response.roleLocked === true,
        needsCompletion: response.needsCompletion !== false,
        requiresDocuments: response.requiresDocuments === true,
        requestedProfile: response.requestedProfile ?? 'auto',
        pending: {
            email: String(pending.email ?? '').trim(),
            name: String(pending.name ?? '').trim(),
            googleUid: String(pending.googleUid ?? '').trim(),
            googleIdToken,
        },
    }
}

export function isGooglePendingAuthResult(
    value: GoogleAuthResult,
): value is GooglePendingAuthResult {
    return 'kind' in value && value.kind === 'google_pending'
}

export async function fetchCurrentSession(): Promise<UserSession | null> {
    const tokenAvailable =
        typeof window !== 'undefined' ? hasAuthTokenInBrowser() : await hasAuthTokenInServer()

    if (!tokenAvailable) {
        return null
    }

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

export async function loginWithGoogle(
    idToken: string,
    profileType: 'auto' | 'client' | 'broker' = 'auto',
): Promise<GoogleAuthResult> {
    const response = await apiClient.post<AuthResponse | GooglePendingResponse>('/auth/google', {
        idToken,
        profileType,
    })

    if (isGooglePendingResponse(response)) {
        return mapGooglePendingResponse(response, idToken)
    }

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

export async function requestPhoneOtp(phone: string): Promise<PhoneOtpIssueResult> {
    return apiClient.post<PhoneOtpIssueResult>('/auth/otp/request', { phone })
}

export async function resendPhoneOtp(sessionToken: string): Promise<PhoneOtpIssueResult> {
    return apiClient.post<PhoneOtpIssueResult>('/auth/otp/resend', { sessionToken })
}

export async function verifyPhoneOtp(sessionToken: string, code: string): Promise<void> {
    await apiClient.post('/auth/otp/verify', { sessionToken, code })
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

