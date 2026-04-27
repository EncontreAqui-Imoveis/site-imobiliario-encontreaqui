import { apiClient } from '@/lib/api/client'

export interface DraftProfileType {
    draftId: string
    draftToken: string
    draft: {
        draftId: string
        profileType: 'client' | 'broker'
        email: string
        name: string
        phone: string | null
        street: string | null
        number: string | null
        complement: string | null
        bairro: string | null
        city: string | null
        state: string | null
        cep: string | null
        withoutNumber: boolean
        creci: string | null
        needsEmailVerification: boolean
        needsPhoneVerification: boolean
        currentStep: string
        status: string
    }
    expiresAtMinutes: number
}

export interface DraftPayload {
    profileType: 'client' | 'broker'
    email: string
    name: string
    phone?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    city?: string
    state?: string
    cep?: string
    withoutNumber?: boolean
    creci?: string
    currentStep?: 'IDENTITY' | 'CONTACT' | 'ADDRESS' | 'VERIFICATION' | 'FINALIZE_CHOICE' | 'FINALIZE_READY'
}

export interface SignupDraftRemoteResponse {
    draft: DraftPayload & { currentStep?: string }
}

export async function createSignupDraftRemote(payload: {
    source: 'email' | 'google'
    email: string
    name: string
    password?: string
    phone?: string
    street?: string
    number?: string
    complement?: string
    bairro?: string
    city?: string
    state?: string
    cep?: string
    withoutNumber?: boolean
    userType: 'client' | 'broker'
    creci?: string
    googleUid?: string
    authProvider?: 'email' | 'google'
    currentStep?: DraftPayload['currentStep']
}): Promise<DraftProfileType> {
    const response = await apiClient.post<{ draftId: string; draftToken: string; draft: Record<string, unknown>; expiresAtMinutes: number }>(
        '/auth/register/draft',
        {
            email: payload.email,
            name: payload.name,
            password: payload.password,
            phone: payload.phone,
            street: payload.street,
            number: payload.number,
            complement: payload.complement,
            bairro: payload.bairro,
            city: payload.city,
            state: payload.state,
            cep: payload.cep,
            withoutNumber: payload.withoutNumber,
            profileType: payload.userType,
            creci: payload.creci,
            googleUid: payload.googleUid,
            authProvider: payload.source === 'google' ? 'google' : payload.authProvider ?? 'email',
            currentStep: payload.currentStep,
        },
    )

    return {
        draftId: response.draftId,
        draftToken: response.draftToken,
        draft: {
            draftId: response.draftId,
            profileType: String(response.draft.profileType ?? payload.userType) as 'client' | 'broker',
            email: String(response.draft.email ?? payload.email),
            name: String(response.draft.name ?? payload.name),
            phone: response.draft.phone ? String(response.draft.phone) : null,
            street: response.draft.street ? String(response.draft.street) : null,
            number: response.draft.number ? String(response.draft.number) : null,
            complement: response.draft.complement ? String(response.draft.complement) : null,
            bairro: response.draft.bairro ? String(response.draft.bairro) : null,
            city: response.draft.city ? String(response.draft.city) : null,
            state: response.draft.state ? String(response.draft.state) : null,
            cep: response.draft.cep ? String(response.draft.cep) : null,
            withoutNumber: Boolean(response.draft.withoutNumber),
            creci: response.draft.creci ? String(response.draft.creci) : null,
            needsEmailVerification: Boolean(response.draft.needsEmailVerification),
            needsPhoneVerification: Boolean(response.draft.needsPhoneVerification),
            currentStep: String(response.draft.currentStep ?? ''),
            status: String(response.draft.status ?? ''),
        },
        expiresAtMinutes: response.expiresAtMinutes,
    }
}

export async function patchSignupDraftRemote(
    draftId: string,
    draftToken: string,
    payload: DraftPayload,
): Promise<SignupDraftRemoteResponse> {
    return apiClient.patch<SignupDraftRemoteResponse & { draft: Record<string, unknown> }>(
        `/auth/register/draft/${encodeURIComponent(draftId)}`,
        payload,
        {
            headers: {
                'x-draft-token': draftToken,
            },
        },
    )
}

export async function getSignupDraftRemote(draftId: string, draftToken: string): Promise<SignupDraftRemoteResponse> {
    return apiClient.get<SignupDraftRemoteResponse>(`/auth/register/draft/${encodeURIComponent(draftId)}`, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function sendSignupDraftEmailCode(
    draftId: string,
    draftToken: string,
): Promise<{ delivery: string; expires_at?: string; cooldown_sec?: number; daily_remaining?: number }> {
    const response = await apiClient.post<
        { status?: string; sentAt?: string; expiresAt?: string; cooldownSec?: number; dailyRemaining?: number }
    >(`/auth/register/draft/${encodeURIComponent(draftId)}/verify-email`, undefined, {
        headers: {
            'x-draft-token': draftToken,
        },
    })

    return {
        delivery: response.status === 'already_verified' ? 'already_verified' : 'sent',
        expires_at: response.expiresAt,
        cooldown_sec: response.cooldownSec,
        daily_remaining: response.dailyRemaining,
    }
}

export async function confirmSignupDraftEmailCode(
    draftId: string,
    draftToken: string,
    code: string,
): Promise<void> {
    await apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/verify-email/confirm`, {
        code,
    }, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function requestSignupDraftPhoneOtp(
    draftId: string,
    draftToken: string,
    phone: string,
): Promise<{ sessionToken: string; expiresAt: string }> {
    return apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/verify-phone`, {
        phone,
    }, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function confirmSignupDraftPhoneCode(
    draftId: string,
    draftToken: string,
    sessionToken: string,
    code: string,
): Promise<void> {
    await apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/verify-phone/confirm`, {
        sessionToken,
        code,
    }, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function submitSignupDraftDocuments(
    draftId: string,
    draftToken: string,
    payload: {
        creciFront: File
        creciBack: File
        selfie: File
    },
): Promise<void> {
    const formData = new FormData()
    formData.append('creciFront', payload.creciFront)
    formData.append('creciBack', payload.creciBack)
    formData.append('selfie', payload.selfie)
    await apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/submit-documents`, formData, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function finalizeSignupDraft(
    draftId: string,
    draftToken: string,
    action: 'client_finalize' | 'broker_send_later' | 'broker_submit_documents',
): Promise<{
    token: string
    user: Record<string, unknown>
    requiresDocuments?: boolean
    needsCompletion?: boolean
    action: string
}> {
    return apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/finalize`, {
        action,
    }, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}

export async function discardSignupDraft(draftId: string, draftToken: string): Promise<void> {
    await apiClient.post(`/auth/register/draft/${encodeURIComponent(draftId)}/discard`, undefined, {
        headers: {
            'x-draft-token': draftToken,
        },
    })
}
