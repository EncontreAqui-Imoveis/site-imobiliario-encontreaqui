import type { UpdateProfilePayload } from '@/lib/api/user'

const SIGNUP_DRAFT_KEY = 'ea_signup_draft_v1'
const SIGNUP_DRAFT_TS_KEY = 'ea_signup_draft_ts_v1'
const PHONE_UPDATE_KEY = 'ea_pending_phone_update_v1'
const PHONE_UPDATE_TS_KEY = 'ea_pending_phone_update_ts_v1'
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type SignupSource = 'email' | 'google'
export type SignupProfileType = 'client' | 'broker'
export type SignupStep =
    | 'profile'
    | 'basic'
    | 'address'
    | 'verify_method'
    | 'email'
    | 'phone'
    | 'documents'

export interface SignupDraftData {
    name: string
    email: string
    password: string
    phone: string
    street: string
    number: string
    semNumero: boolean
    complement: string
    bairro: string
    city: string
    state: string
    cep: string
    creci: string
    googleIdToken: string
    googleUid: string
}

export interface SignupDraft {
    source: SignupSource
    userType: SignupProfileType | null
    step: SignupStep
    emailVerified: boolean
    phoneVerified: boolean
    data: SignupDraftData
    updatedAt: string
}

export interface PendingPhoneUpdateDraft {
    phone: string
    payload: UpdateProfilePayload
    updatedAt: string
}

const EMPTY_DATA: SignupDraftData = {
    name: '',
    email: '',
    password: '',
    phone: '',
    street: '',
    number: '',
    semNumero: false,
    complement: '',
    bairro: '',
    city: '',
    state: '',
    cep: '',
    creci: '',
    googleIdToken: '',
    googleUid: '',
}

function isBrowser() {
    return typeof window !== 'undefined'
}

function isExpired(timestampKey: string) {
    if (!isBrowser()) return true
    const raw = window.localStorage.getItem(timestampKey)
    if (!raw) return false
    const value = Number(raw)
    if (!Number.isFinite(value)) return false
    return Date.now() - value > MAX_DRAFT_AGE_MS
}

export function createSignupDraft(
    input?: Partial<Omit<SignupDraft, 'data' | 'updatedAt'>> & { data?: Partial<SignupDraftData> },
): SignupDraft {
    return {
        source: input?.source ?? 'email',
        userType: input?.userType ?? null,
        step: input?.step ?? 'profile',
        emailVerified: input?.emailVerified ?? input?.source === 'google',
        phoneVerified: input?.phoneVerified ?? false,
        data: {
            ...EMPTY_DATA,
            ...(input?.data ?? {}),
        },
        updatedAt: new Date().toISOString(),
    }
}

export function loadSignupDraft(): SignupDraft | null {
    if (!isBrowser()) return null
    if (isExpired(SIGNUP_DRAFT_TS_KEY)) {
        clearSignupDraft()
        return null
    }

    try {
        const raw = window.localStorage.getItem(SIGNUP_DRAFT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<SignupDraft>
        return createSignupDraft({
            source: parsed.source,
            userType: parsed.userType ?? null,
            step: parsed.step,
            emailVerified: parsed.emailVerified,
            phoneVerified: parsed.phoneVerified,
            data: parsed.data,
        })
    } catch {
        return null
    }
}

export function saveSignupDraft(draft: SignupDraft) {
    if (!isBrowser()) return
    window.localStorage.setItem(
        SIGNUP_DRAFT_KEY,
        JSON.stringify({
            ...draft,
            updatedAt: new Date().toISOString(),
        } satisfies SignupDraft),
    )
    window.localStorage.setItem(SIGNUP_DRAFT_TS_KEY, String(Date.now()))
}

export function patchSignupDraft(
  input: Partial<Omit<SignupDraft, 'data' | 'updatedAt'>> & { data?: Partial<SignupDraftData> },
): SignupDraft {
    const current = loadSignupDraft() ?? createSignupDraft()
    const next = createSignupDraft({
        ...current,
        ...input,
        data: {
            ...current.data,
            ...(input.data ?? {}),
        },
    })
  saveSignupDraft(next)
  return next
}

export function markSignupDraftEmailVerified(
  step: SignupStep = 'verify_method',
): SignupDraft | null {
  const current = loadSignupDraft()
  if (!current) return null

  const next = createSignupDraft({
    ...current,
    emailVerified: true,
    step,
    data: current.data,
  })
  saveSignupDraft(next)
  return next
}

export function clearSignupDraft() {
    if (!isBrowser()) return
    window.localStorage.removeItem(SIGNUP_DRAFT_KEY)
    window.localStorage.removeItem(SIGNUP_DRAFT_TS_KEY)
}

export function hasSignupDraft() {
    return loadSignupDraft() !== null
}

/** Volta o rascunho para a etapa de endereço (ex.: após “verificar método”). */
export function rewindSignupDraftToAddress(): SignupDraft | null {
    const d = loadSignupDraft()
    if (!d) return null
    const next: SignupDraft = {
        ...d,
        step: 'address',
        updatedAt: new Date().toISOString(),
    }
    saveSignupDraft(next)
    return next
}

export function resolveSignupDraftHref(draft: SignupDraft | null | undefined) {
    if (!draft) return '/auth/cadastro'
    if (draft.step === 'verify_method') return '/cadastro/verificar-metodo'
    if (draft.step === 'email') return '/verificacao?flow=signup'
    if (draft.step === 'phone') return '/cadastro/verificar-telefone?flow=signup'
    if (draft.step === 'documents') return '/onboarding/broker?mode=signup'
    return '/auth/cadastro'
}

export function savePendingPhoneUpdateDraft(draft: PendingPhoneUpdateDraft) {
    if (!isBrowser()) return
    window.localStorage.setItem(PHONE_UPDATE_KEY, JSON.stringify(draft))
    window.localStorage.setItem(PHONE_UPDATE_TS_KEY, String(Date.now()))
}

export function loadPendingPhoneUpdateDraft(): PendingPhoneUpdateDraft | null {
    if (!isBrowser()) return null
    if (isExpired(PHONE_UPDATE_TS_KEY)) {
        clearPendingPhoneUpdateDraft()
        return null
    }

    try {
        const raw = window.localStorage.getItem(PHONE_UPDATE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as PendingPhoneUpdateDraft
        return {
            phone: String(parsed.phone ?? '').trim(),
            payload: parsed.payload ?? {},
            updatedAt: String(parsed.updatedAt ?? new Date().toISOString()),
        }
    } catch {
        return null
    }
}

export function clearPendingPhoneUpdateDraft() {
    if (!isBrowser()) return
    window.localStorage.removeItem(PHONE_UPDATE_KEY)
    window.localStorage.removeItem(PHONE_UPDATE_TS_KEY)
}
