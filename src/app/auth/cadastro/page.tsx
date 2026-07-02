'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    checkEmail,
    checkCreci,
    isGooglePendingAuthResult,
} from '@/lib/api/auth'
import { loginWithGooglePopup } from '@/lib/auth/googleFlow'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import {
    clearSignupDraft,
    createSignupDraft,
    loadSignupDraft,
    patchSignupDraft,
    resolveSignupDraftHref,
    saveSignupDraft,
    type SignupDraft,
} from '@/lib/authSignupDraft'
import { useUser } from '@/contexts/UserContext'
import type { ApiError } from '@/lib/api/client'
import { formatPhoneInput } from '@/lib/phoneInput'
import { fetchCitiesByState } from '@/lib/locationOptionsApi'
import {
    createSignupDraftRemote,
    discardSignupDraft,
    patchSignupDraftRemote,
} from '@/lib/api/signupDraft'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import SignupLegalNotice from '@/components/legal/SignupLegalNotice'

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const STEP_SUBTITLES = {
    profile: 'Selecione seu tipo de perfil para avançarmos para o próximo passo.',
    basic: 'Preencha seus dados iniciais para avançarmos.',
    address: 'Informe seu endereço para concluir seu cadastro.',
} as const

type DraftConflictCode = 'emailAlreadyRegistered' | 'draftAlreadyExists'

function getDraftConflictFromError(error: unknown): DraftConflictCode | null {
    const apiError = error as ApiError
    if (!apiError || apiError.status !== 409 || !apiError.payload?.code) {
        return null
    }

    const code = String(apiError.payload.code).toUpperCase()
    if (code === 'EMAIL_ALREADY_EXISTS' || code === 'EMAIL_ALREADY_REGISTERED') {
        return 'emailAlreadyRegistered'
    }

    if (code === 'DRAFT_ALREADY_EXISTS' || code === 'DRAFT_DUPLICATE_ACCOUNT') {
        return 'draftAlreadyExists'
    }

    return null
}

function formatCep(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function normalizePhone(value: string) {
    return value.replace(/\D/g, '')
}

function normalizeCreci(value: string) {
    return value.replace(/\s+/g, '').toUpperCase().trim()
}

function formatFieldError(fieldLabel: string, values?: string[]) {
    if (!values || values.length === 0) return `${fieldLabel} inválido.`
    return `${fieldLabel} inválido. ${values.join(', ')}`
}

function hasRequiredAddress(draft: SignupDraft) {
    if (draft.userType !== 'broker') return true
    return Boolean(
        draft.data.street.trim() &&
        (draft.data.semNumero || draft.data.number.trim()) &&
        draft.data.bairro.trim() &&
        draft.data.city.trim() &&
        draft.data.state.trim(),
    )
}

function shouldIncludeAddressPayload(stepForPayload: SignupDraft['step'], draft: SignupDraft): boolean {
    if (
        stepForPayload !== 'address'
        && stepForPayload !== 'verify_method'
        && stepForPayload !== 'email'
        && stepForPayload !== 'phone'
        && stepForPayload !== 'documents'
    ) {
        return false
    }

    return hasRequiredAddress(draft)
}

function isEquivalentDraftForRender(left: SignupDraft, right: SignupDraft) {
    return (
        left.source === right.source
        && left.userType === right.userType
        && left.step === right.step
        && left.emailVerified === right.emailVerified
        && left.phoneVerified === right.phoneVerified
        && left.draftId === right.draftId
        && left.draftToken === right.draftToken
        && left.data.name === right.data.name
        && left.data.email === right.data.email
        && left.data.password === right.data.password
        && left.data.phone === right.data.phone
        && left.data.street === right.data.street
        && left.data.number === right.data.number
        && left.data.semNumero === right.data.semNumero
        && left.data.complement === right.data.complement
        && left.data.bairro === right.data.bairro
        && left.data.city === right.data.city
        && left.data.state === right.data.state
        && left.data.cep === right.data.cep
        && left.data.creci === right.data.creci
        && left.data.googleIdToken === right.data.googleIdToken
        && left.data.googleUid === right.data.googleUid
    )
}

function isGooglePopupClosedError(err: unknown): boolean {
    const code = (err as { code?: unknown }).code
    const message = (err as { message?: unknown }).message
    return (
        code === 'auth/popup-closed-by-user'
        || code === 'auth/cancelled-popup-request'
        || String(message).toLowerCase().includes('popup-closed-by-user')
    )
}

function isNetworkError(error: unknown): error is Error {
    if (!(error instanceof Error)) return false
    const message = error.message.toLowerCase()
    return error.name === 'TypeError' && (message.includes('failed to fetch') || message.includes('network error'))
}

function getDraftValidationError(error: unknown, step: 'profile' | 'basic' | 'address' | 'verify_method' | 'email' | 'phone' | 'documents'): string | null {
    const apiError = error as ApiError
    if (!apiError || apiError.status !== 400 || !apiError.payload?.code) {
        return null
    }

    const code = String(apiError.payload.code).toUpperCase()
    const fields = apiError.payload.fields as Record<string, string[]> | undefined
    if (
        (code === 'CRECI_INVALID' || code === 'DRAFT_CRICI_INVALID')
        && ['profile', 'basic', 'address', 'verify_method', 'documents', 'email', 'phone'].includes(step)
    ) {
        return formatFieldError('CRECI', fields?.creci)
    }
    if (code === 'DRAFT_ADDRESS_INVALID' && step === 'address') {
        return 'Endereço inválido.'
    }

    return null
}

export default function CadastroPage() {
    const router = useRouter()
    const { session, refresh } = useUser()

    const [draft, setDraft] = useState<SignupDraft>(() =>
        createSignupDraft({
            step: 'profile',
            userType: 'client', // Cliente selecionado por padrão para renderizar os campos
            data: { state: 'GO' },
        }),
    )
    const [confirmPassword, setConfirmPassword] = useState('')
    const [ready, setReady] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cepLoading, setCepLoading] = useState(false)
    const [restoredDraft, setRestoredDraft] = useState(false)
    const [draftConflictCode, setDraftConflictCode] = useState<DraftConflictCode | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [cityOptions, setCityOptions] = useState<string[]>([])
    const [citiesLoading, setCitiesLoading] = useState(false)
    const cepLookupTimeoutRef = useRef<number | null>(null)
    const lastCompletedCep = useRef('')

    useEffect(() => {
        if (session) {
            router.replace(resolvePostAuthRoute(session, '/meus-imoveis'))
            return
        }

        const existing = loadSignupDraft()
        if (existing) {
            // Se já tem rascunho com perfil, mantemos na tela unificada com o tipo de perfil restaurado
            const restored = createSignupDraft({
                ...existing,
                step: 'profile', // Sempre inicia na tela principal
                userType: existing.userType || 'client',
            })

            if (
                existing.step === 'verify_method' ||
                existing.step === 'email' ||
                existing.step === 'phone' ||
                existing.step === 'documents'
            ) {
                router.replace(resolveSignupDraftHref(existing))
                return
            }

            setDraft((current) => (isEquivalentDraftForRender(current, restored) ? current : restored))
            if (restored.data.password) {
                setConfirmPassword(restored.data.password)
            }
            setRestoredDraft(true)
        }
        setReady(true)
    }, [router.replace, router.push, session])

    const stepIndex = useMemo(() => {
        switch (draft.step) {
            case 'profile':
            case 'basic':
                return 0
            default:
                return 2
        }
    }, [draft.step])
    const stepSubtitle = useMemo(() => {
        if (draft.step === 'profile' || draft.step === 'basic') return 'Selecione seu tipo de perfil e preencha seus dados.'
        return STEP_SUBTITLES.address
    }, [draft.step])

    const isGoogleFlow = draft.source === 'google'
    const isLoading = submitting || googleLoading
    const selectionCards = [
        {
            value: 'client' as const,
            title: 'Quero cadastrar como cliente',
            description: 'Para favoritar imóveis, gerar propostas e acompanhar contratos.',
            helper: 'Acesso focado em busca, proposta e acompanhamento.',
        },
        {
            value: 'broker' as const,
            title: 'Quero cadastrar como corretor',
            description: 'Para anunciar imóveis, gerar propostas e operar a carteira.',
            helper: 'Acesso para operação comercial e gestão da carteira.',
        },
    ]

    const updateDraft = (
        data: Partial<SignupDraft['data']>,
        extra?: Partial<Omit<SignupDraft, 'data' | 'updatedAt'>>,
    ) => {
        setDraft((current) => ({
            ...current,
            ...extra,
            data: {
                ...current.data,
                ...data,
            },
            updatedAt: new Date().toISOString(),
        }))
    }

    const persistDraft = (next: SignupDraft) => {
        saveSignupDraft(next)
        setDraft(next)
    }

    const resolveDraftAddressPayload = (
        next: SignupDraft,
        includePassword = false,
        remoteStep: SignupDraft['step'] = next.step,
    ) => {
        const authProvider: 'google' | 'email' = next.source === 'google' ? 'google' : 'email'
        const includeAddress = shouldIncludeAddressPayload(remoteStep, next)
        const normalizedCreci = normalizeCreci(next.data.creci)
        const normalizedState = next.data.state.trim().toUpperCase()
        const includeCreci = remoteStep !== 'profile' && normalizedCreci && next.userType === 'broker'
        const normalizedPhone = normalizePhone(next.data.phone)
        const includePhone = Boolean(normalizedPhone)

        if (!includeAddress) {
            return {
                profileType: next.userType ?? 'client',
                email: next.data.email.trim().toLowerCase(),
                name: next.data.name.trim(),
                ...(includePhone ? { phone: normalizedPhone } : {}),
                authProvider,
                googleUid: next.data.googleUid,
                ...(includePassword && next.source !== 'google' ? { password: next.data.password } : {}),
                ...(includeCreci ? { creci: normalizedCreci } : {}),
                currentStep: mapDraftStepToRemote(remoteStep),
            }
        }

        return {
            profileType: next.userType ?? 'client',
            email: next.data.email.trim().toLowerCase(),
            name: next.data.name.trim(),
            ...(includePhone ? { phone: normalizedPhone } : {}),
            street: next.data.street.trim(),
            number: next.data.number.trim(),
            complement: next.data.complement.trim(),
            bairro: next.data.bairro.trim(),
            city: next.data.city.trim(),
            state: normalizedState,
            cep: next.data.cep.replace(/\D/g, ''),
            withoutNumber: next.data.semNumero,
            authProvider,
            googleUid: next.data.googleUid,
            ...(includePassword && next.source !== 'google' ? { password: next.data.password } : {}),
            currentStep: mapDraftStepToRemote(remoteStep),
            ...(includeCreci ? { creci: normalizedCreci } : {}),
        }
    }

    const handleDraftConflict = (error: unknown) => {
        const conflict = getDraftConflictFromError(error)
        if (conflict === 'emailAlreadyRegistered') {
            setDraftConflictCode(conflict)
            setError('Este e-mail já está cadastrado. Faça login para continuar.')
            return true
        }
        if (conflict === 'draftAlreadyExists') {
            setDraftConflictCode(conflict)
            setError('Já existe um cadastro em andamento para este e-mail.')
            return true
        }
        setDraftConflictCode(null)
        return false
    }

    const mapDraftStepToRemote = (
        step: SignupDraft['step'],
    ): NonNullable<Parameters<typeof createSignupDraftRemote>[0]['currentStep']> => {
        if (step === 'profile') return 'IDENTITY'
        if (step === 'basic') return 'CONTACT'
        if (step === 'address' || step === 'verify_method' || step === 'email' || step === 'phone' || step === 'documents') {
            return 'VERIFICATION'
        }
        return 'CONTACT'
    }

    const syncDraftWithServer = async (
        next: SignupDraft,
        options?: { remoteStep?: SignupDraft['step'] },
    ): Promise<SignupDraft> => {
        const shouldUseCreate = !next.draftId || !next.draftToken
        const payload = resolveDraftAddressPayload(next, shouldUseCreate, options?.remoteStep)
        if (shouldUseCreate) {
            const created = await createSignupDraftRemote({
                source: next.source,
                userType: next.userType ?? 'client',
                ...payload,
            })

            return createSignupDraft({
                ...next,
                draftId: created.draftId,
                draftToken: created.draftToken,
                step: next.step,
                data: {
                    ...next.data,
                    phone: created.draft?.phone ?? next.data.phone,
                    state: created.draft?.state ?? next.data.state,
                    cep: created.draft?.cep ?? next.data.cep,
                },
            })
        }

        if (!next.draftId || !next.draftToken) {
            return next
        }

        await patchSignupDraftRemote(
            next.draftId,
            next.draftToken,
            payload,
        )
        return next
    }

    const handleSelectProfile = (value: 'client' | 'broker') => {
        const next = createSignupDraft({
            ...draft,
            userType: value,
        })
        persistDraft(next)
        setError(null)
        setDraftConflictCode(null)
    }

    const handleResumeDraft = () => {
        router.push(resolveSignupDraftHref(draft))
    }

    const handleCepLookup = async (cleanCep: string, addressSnapshot: SignupDraft['data']) => {
        if (cleanCep.length !== 8 || lastCompletedCep.current === cleanCep) return

        lastCompletedCep.current = cleanCep
        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                updateDraft({
                    street: data.logradouro || addressSnapshot.street,
                    bairro: data.bairro || addressSnapshot.bairro,
                    city: data.localidade || addressSnapshot.city,
                    state: data.uf || addressSnapshot.state,
                })
            }
        } catch {
            // Usuário ainda pode preencher manualmente.
        } finally {
            setCepLoading(false)
        }
    }

    useEffect(() => {
        const cleanCep = draft.data.cep.replace(/\D/g, '')
        if (cepLookupTimeoutRef.current) {
            window.clearTimeout(cepLookupTimeoutRef.current)
            cepLookupTimeoutRef.current = null
        }

        if (cleanCep.length !== 8) {
            if (draft.data.cep.length === 0) {
                lastCompletedCep.current = ''
            }
            return
        }
        if (lastCompletedCep.current === cleanCep) {
            return
        }

        cepLookupTimeoutRef.current = window.setTimeout(() => {
            void handleCepLookup(cleanCep, draft.data)
        }, 260)

        return () => {
            if (cepLookupTimeoutRef.current) {
                window.clearTimeout(cepLookupTimeoutRef.current)
            }
        }
    }, [draft.data.cep, draft.data.street, draft.data.bairro, draft.data.city, draft.data.state])

    const handleCepBlur = () => {
        const cleanCep = draft.data.cep.replace(/\D/g, '')
        if (!cleanCep.length) return
        void handleCepLookup(cleanCep, draft.data)
    }

    const handleGoogleRegister = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            const result = await loginWithGooglePopup()
            if (isGooglePendingAuthResult(result)) {
                const googleDraft = createSignupDraft({
                    ...draft,
                    source: 'google',
                    step: 'profile',
                    userType: null,
                    emailVerified: true,
                    data: {
                        ...draft.data,
                        email: result.pending.email,
                        name: result.pending.name,
                        googleIdToken: result.pending.googleIdToken,
                        googleUid: result.pending.googleUid,
                        state: draft.data.state || 'GO',
                    },
                })

                persistDraft(googleDraft)
                setRestoredDraft(false)
                setError(null)
                setDraft(googleDraft)
                return
            }
            await refresh()
            router.push(resolvePostAuthRoute(result, '/meus-imoveis'))
        } catch (err) {
            if (isGooglePopupClosedError(err)) {
                return
            }

            const isNetwork = isNetworkError(err)
            const apiErr = err as ApiError
            if (isNetwork) {
                setError('Falha de conexão com o servidor. Verifique sua conexão e tente novamente.')
                return
            }
            const validationError = getDraftValidationError(apiErr, 'profile')
            if (validationError) {
                setError(validationError)
            } else if (!handleDraftConflict(apiErr)) {
                setError(apiErr?.message || 'Erro ao conectar com o Google. Tente novamente.')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleContinueProfile = (event: React.FormEvent) => {
        event.preventDefault()
        if (!draft.userType) {
            setError('Escolha se deseja continuar como cliente ou corretor.')
            return
        }

        const next = patchSignupDraft({
            source: draft.source,
            userType: draft.userType,
            step: 'basic',
            emailVerified: draft.source === 'google',
            data: draft.data,
        })
        setDraftConflictCode(null)
        setError(null)
        setDraft(next)
        persistDraft(next)
    }

    const handleContinueBasic = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)
        setDraftConflictCode(null)

        const { name, email, password, phone, creci } = draft.data
        if (!name.trim()) {
            setError('Informe seu nome completo.')
            setSubmitting(false)
            return
        }
        if (!email.trim().includes('@')) {
            setError('Informe um e-mail válido.')
            setSubmitting(false)
            return
        }
        if (!isGoogleFlow && password.trim().length < 6) {
            setError('A senha precisa ter pelo menos 6 caracteres.')
            setSubmitting(false)
            return
        }
        if (!isGoogleFlow && password !== confirmPassword) {
            setError('As senhas não coincidem. Verifique sua senha e confirmação.')
            setSubmitting(false)
            return
        }
        const normalizedPhone = normalizePhone(phone)
        if (draft.userType === 'broker' && normalizedPhone.length < 10) {
            setError('Informe um telefone válido.')
            setSubmitting(false)
            return
        }
        const normalizedCreci = normalizeCreci(creci)
        if (draft.userType === 'broker' && !normalizedCreci) {
            setError('O CRECI é obrigatório para corretores.')
            setSubmitting(false)
            return
        }

        try {
            if (!isGoogleFlow) {
                const emailStatus = await checkEmail(email.trim())
                if (emailStatus.exists) {
                    setError('Já existe uma conta com este e-mail.')
                    setSubmitting(false)
                    return
                }
            }

            if (draft.userType === 'broker') {
                const normalizedCreci = normalizeCreci(creci)
                const creciStatus = await checkCreci(normalizedCreci)
                if (creciStatus.exists) {
                    setError('Já existe um corretor com este CRECI.')
                    setSubmitting(false)
                    return
                }
            }

            const next = patchSignupDraft({
                step: 'address',
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    phone: formatPhoneInput(phone),
                    creci: normalizedCreci,
                },
            })
            const syncedDraft = await syncDraftWithServer(next, { remoteStep: 'basic' })
            persistDraft(syncedDraft)
            setDraft(syncedDraft)
        } catch (err) {
            const apiErr = err as ApiError
            if (isNetworkError(err)) {
                setError('Falha de conexão com o servidor. Verifique sua conexão e tente novamente.')
                return
            }
            const validationError = getDraftValidationError(apiErr, 'basic')
            if (validationError) {
                setError(validationError)
            } else if (!handleDraftConflict(apiErr)) {
                setError(apiErr?.message || 'Não foi possível validar seus dados agora.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleContinueAddress = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)
        setDraftConflictCode(null)

        const next = createSignupDraft({
            ...draft,
            step: 'verify_method',
            data: {
                ...draft.data,
                cep: draft.data.cep.replace(/\D/g, ''),
                street: draft.data.street.trim(),
                number: draft.data.semNumero ? 'S/N' : draft.data.number.trim(),
                complement: draft.data.complement.trim(),
                bairro: draft.data.bairro.trim(),
                city: draft.data.city.trim(),
                state: draft.data.state.trim().toUpperCase(),
            },
        })

        if (!hasRequiredAddress(next)) {
            setError('Preencha o endereço completo antes de continuar.')
            setSubmitting(false)
            return
        }

        try {
            const syncedDraft = await syncDraftWithServer(next)
            persistDraft(syncedDraft)
            router.push(resolveSignupDraftHref(syncedDraft))
        } catch (err) {
            const apiErr = err as ApiError
            if (isNetworkError(err)) {
                setError('Falha de conexão com o servidor. Verifique sua conexão e tente novamente.')
                return
            }
            const validationError = getDraftValidationError(apiErr, 'address')
            if (validationError) {
                setError(validationError)
            } else if (!handleDraftConflict(apiErr)) {
                setError(apiErr?.message || 'Não foi possível salvar o endereço.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDiscardDraft = async () => {
        if (draft.draftId && draft.draftToken) {
            try {
                await discardSignupDraft(draft.draftId, draft.draftToken)
            } catch {
                // Não bloquear usuário caso o backend já tenha expirado.
            }
        }
        clearSignupDraft()
        setDraftConflictCode(null)
        setDraft(createSignupDraft({ step: 'profile', data: { state: 'GO' } }))
        setRestoredDraft(false)
        setError(null)
    }

    const handleSwitchAccount = async () => {
        await handleDiscardDraft()
        router.push('/auth/login')
    }

    useEffect(() => {
        let canceled = false
        void (async () => {
            if (!draft.data.state.trim()) {
                setCityOptions([])
                setCitiesLoading(false)
                return
            }

            setCitiesLoading(true)
            const options = await fetchCitiesByState(draft.data.state)
            if (!canceled) {
                setCityOptions(options)
                setCitiesLoading(false)
            }
        })()

        return () => {
            canceled = true
        }
    }, [draft.data.state])

    if (!ready) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando cadastro...</p>
            </div>
        )
    }

    /* ─────────────────────────────────────────────────────────────
       ÍCONES INLINE (SVG)
    ───────────────────────────────────────────────────────────── */
    const IconUser = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )

    const IconMail = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )

    const IconPhone = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    )

    const IconLock = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )

    const IconLockConfirm = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 11l2 2 4-4" />
        </svg>
    )

    const IconArrow = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    )

    const IconBack = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
    )

    const GoogleLogo = () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )

    return (
        /*
         * h-screen + overflow-hidden → sem scroll vertical em desktop
         * font-[DM_Sans] → fonte da marca conforme globals.css
         */
        <div className="flex w-full overflow-hidden" style={{ fontFamily: 'var(--font-dm-sans)', zoom: '1.1', height: 'calc(100vh / 1.1)' }}>

            {/* ── Botão voltar — fixo no canto superior esquerdo ── */}
            <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="fixed left-5 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg"
            >
                <IconBack />
            </Link>

            {/* ══════════════════════════════════════════════════
                PAINEL ESQUERDO — Adaptável (35% em lg, 30% em xl)
            ══════════════════════════════════════════════════ */}
            <aside
                className="hidden lg:flex w-[42%] xl:w-[40%] shrink-0 flex-col justify-end h-full pt-16 pb-16 px-10 xl:px-14 xl:pt-24 xl:pb-20 text-left relative overflow-hidden"
            >
                {/* Camada Cliente: Casal Feliz + Sombreado Escuro + Toque Sutil de Amarelo */}
                <div
                    className={`absolute inset-0 bg-[url('/casal-feliz.webp')] bg-cover bg-[position:center_30%] transition-opacity duration-500 ease-in-out z-0 ${draft.userType === 'client' ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* Overlay gradiente escuro idêntico ao do login para máximo contraste do texto branco */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                    {/* Overlay amarelo sutil (muito menos laranjado) */}
                    <div className="absolute inset-0 bg-[#ffce44]/15 mix-blend-multiply z-0" />
                </div>

                {/* Camada Corretor: Sala Moderna + Filtro Escuro */}
                <div
                    className={`absolute inset-0 bg-[url('/background-casa.webp')] bg-cover bg-[position:center_30%] transition-opacity duration-500 ease-in-out z-0 ${draft.userType === 'broker' ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* Overlay escuro gradiente para combinar com o tema corretor e dar legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-950/40 to-transparent z-10" />
                </div>

                {/* Headline no rodapé — sempre em branco e condicional por perfil */}
                <div className="relative z-20 text-left space-y-3 w-full">
                    <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-tight transition-all whitespace-nowrap">
                        {draft.userType === 'broker' ? 'Conecte seu negócio.' : 'Encontre seu lar.'}
                    </h1>
                    <p className="text-sm sm:text-base leading-relaxed text-white/90 font-normal max-w-[460px] transition-all">
                        {draft.userType === 'broker'
                            ? 'A plataforma ideal para gerenciar seus imóveis, acompanhar leads e fechar negócios com agilidade.'
                            : 'Crie sua conta para favoritar imóveis, enviar propostas e conversar com proprietários.'}
                    </p>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════
                PAINEL DIREITO — Responsivo e Centralizado/Alinhado
            ══════════════════════════════════════════════════ */}
            <main
                className="flex flex-1 items-center justify-start overflow-y-auto xl:overflow-y-hidden bg-white px-4 py-5 sm:p-6 xl:pl-20 xl:pr-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/*
                  * Formulário de cadastro posicionado de forma plana diretamente sobre o background branco
                  */}
                <div className="w-full max-w-[95%] sm:max-w-[640px] md:max-w-[700px] lg:max-w-[850px] xl:max-w-[1080px] p-5 sm:p-6">

                    {/* Logo da Marca (sem container/borda branca) */}
                    <div className="flex justify-start mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo1.svg"
                            alt="EncontreAqui Imóveis"
                            className="h-10 xl:h-11 w-auto"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement
                                t.src = '/logo_circular.png'
                                t.className = 'h-10 xl:h-11 w-10 xl:w-11 rounded-full object-contain'
                            }}
                        />
                    </div>

                    {/* Cabeçalho */}
                    <div className="mb-3 text-left">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Criar conta</h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{stepSubtitle}</p>
                    </div>

                    {/* Aviso de rascunho restaurado */}
                    {restoredDraft && (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                            <p className="font-semibold">Rascunho restaurado</p>
                            <p className="mt-0.5">Retomamos o seu cadastro de onde ele parou.</p>
                            <button
                                type="button"
                                onClick={handleDiscardDraft}
                                className="mt-1 inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                            >
                                Descartar cadastro
                            </button>
                        </div>
                    )}

                    {/* Conflito de conta existente */}
                    {draftConflictCode && (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                            {draftConflictCode === 'emailAlreadyRegistered' && (
                                <>
                                    <p className="font-semibold">E-mail já cadastrado</p>
                                    <p className="mt-0.5">Encontramos uma conta existente para esse e-mail. Faça login para continuar.</p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <Link href="/auth/login" className="inline-flex rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition">
                                            Entrar
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleDiscardDraft}
                                            className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                                        >
                                            Descartar cadastro
                                        </button>
                                    </div>
                                </>
                            )}
                            {draftConflictCode === 'draftAlreadyExists' && (
                                <>
                                    <p className="font-semibold">Cadastro em andamento</p>
                                    <p className="mt-0.5">Já existe um cadastro em andamento para este e-mail.</p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={handleResumeDraft}
                                            className="inline-flex rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition"
                                        >
                                            Continuar cadastro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDiscardDraft}
                                            className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                                        >
                                            Descartar cadastro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSwitchAccount}
                                            className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                                        >
                                            Trocar de conta
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 0: SELEÇÃO DE PERFIL E DADOS BÁSICOS (UNIFICADOS) ── */}
                    {stepIndex === 0 && (
                        <form onSubmit={handleContinueBasic} className="space-y-2.5" aria-describedby={error ? 'register-error' : undefined}>

                            {/* Seleção do Perfil */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {selectionCards.map((option) => {
                                    const isSelected = draft.userType === option.value
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={isSelected}
                                            aria-describedby={`signup-role-${option.value}-hint`}
                                            onClick={() => handleSelectProfile(option.value)}
                                            className={`group relative cursor-pointer rounded-xl border py-2.5 px-3.5 text-left transition-all outline-none ${isSelected
                                                ? 'border-yellow-400 bg-yellow-50/20 ring-2 ring-yellow-400/30'
                                                : 'border-gray-200 bg-white hover:border-yellow-400/40 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-gray-900 leading-tight">{option.title}</p>
                                                    <p className="text-[11px] sm:text-xs text-gray-500 leading-normal">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Inputs em 2 colunas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 pt-0.5">

                                {/* Nome Completo */}
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome completo *</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                            <IconUser />
                                        </span>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            value={draft.data.name}
                                            onChange={(e) => updateDraft({ name: e.target.value })}
                                            maxLength={120}
                                            placeholder="Ex: João Silva"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                    </div>
                                </div>

                                {/* E-mail */}
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail *</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                            <IconMail />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            disabled={isGoogleFlow}
                                            value={draft.data.email}
                                            onChange={(e) => updateDraft({ email: e.target.value })}
                                            maxLength={120}
                                            placeholder="seu@email.com"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30 disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div className="space-y-1.5">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                            <IconPhone />
                                        </span>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={draft.data.phone}
                                            onChange={(e) => updateDraft({ phone: formatPhoneInput(e.target.value) })}
                                            maxLength={15}
                                            placeholder="Ex: (11) 99999-9999"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                    </div>
                                </div>

                                {/* Senha */}
                                {!isGoogleFlow && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha *</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                                <IconLock />
                                            </span>
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={6}
                                                maxLength={256}
                                                value={draft.data.password}
                                                onChange={(e) => updateDraft({ password: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600"
                                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Confirmar Senha */}
                                {!isGoogleFlow && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700">Confirmar Senha *</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                                <IconLockConfirm />
                                            </span>
                                            <input
                                                id="password-confirm"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-11 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((current) => !current)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600"
                                                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* CRECI (se perfil for Corretor) */}
                                {draft.userType === 'broker' && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="creci" className="block text-sm font-medium text-gray-700">CRECI *</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                                                <IconUser />
                                            </span>
                                            <input
                                                id="creci"
                                                type="text"
                                                required
                                                value={draft.data.creci}
                                                onChange={(e) => updateDraft({ creci: normalizeCreci(e.target.value) })}
                                                maxLength={25}
                                                placeholder="Ex: 12345-F"
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Checkbox de Aceitar Termos */}
                            <div className="pt-0.5">
                                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-1 h-4 w-4 rounded border-gray-300"
                                        style={{ accentColor: '#ffce44' }}
                                    />
                                    <span className="leading-tight">
                                        Aceito os <Link href="/termos" target="_blank" className="font-semibold text-gray-855 underline hover:text-gray-955">Termos de Uso</Link> e <Link href="/privacidade" target="_blank" className="font-semibold text-gray-855 underline hover:text-gray-955">Privacidade</Link>.
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <p id="register-error" role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            {/* Botão de Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold active:scale-[.99] disabled:opacity-60 transition-all duration-500 ${draft.userType === 'broker'
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                                    : 'bg-[#ffce44] hover:brightness-95 text-gray-900'
                                    }`}
                                style={draft.userType === 'broker' ? undefined : { backgroundColor: '#ffce44' }}
                            >
                                {submitting ? 'Criando Conta...' : 'Criar Conta'}
                                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                    <IconArrow />
                                </span>
                            </button>

                            {/* Google login no rodapé do cadastro */}
                            {!isGoogleFlow && (
                                <>
                                    <div className="my-3 flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-200" />
                                        <span className="text-xs text-gray-400">ou continue com</span>
                                        <div className="h-px flex-1 bg-gray-200" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleRegister}
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 active:scale-[.99]"
                                    >
                                        <GoogleLogo />
                                        Google
                                    </button>
                                </>
                            )}
                        </form>
                    )}

                    {/* ── STEP 2: ENDEREÇO (CEP, Cidade, Estado, Rua, etc.) ── */}
                    {stepIndex === 2 && (
                        <form onSubmit={handleContinueAddress} className="space-y-5" aria-describedby={error ? 'register-error' : undefined}>
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-bold text-gray-900 mb-2">Endereço</legend>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP (opcional)</label>
                                        <input
                                            id="cep"
                                            type="text"
                                            value={formatCep(draft.data.cep)}
                                            onChange={(e) => updateDraft({ cep: formatCep(e.target.value) })}
                                            onBlur={handleCepBlur}
                                            placeholder="00000-000"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                        {cepLoading && <p role="status" aria-live="polite" className="text-xs text-yellow-600 animate-pulse">Buscando CEP...</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                                        <select
                                            id="state"
                                            value={draft.data.state}
                                            onChange={(e) => updateDraft({ state: e.target.value })}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        >
                                            <option value="">UF</option>
                                            {BRAZILIAN_STATES.map((uf) => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                                        <input
                                            id="city"
                                            type="text"
                                            list="signup-city-options"
                                            value={draft.data.city}
                                            onChange={(e) => updateDraft({ city: e.target.value })}
                                            maxLength={25}
                                            placeholder={citiesLoading ? 'Carregando cidades...' : 'Sua cidade'}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                        <datalist id="signup-city-options">
                                            {cityOptions.map((option) => (
                                                <option key={option} value={option} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
                                        <input
                                            id="bairro"
                                            type="text"
                                            value={draft.data.bairro}
                                            onChange={(e) => updateDraft({ bairro: e.target.value })}
                                            maxLength={120}
                                            placeholder="Bairro"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">Rua</label>
                                    <input
                                        id="street"
                                        type="text"
                                        value={draft.data.street}
                                        onChange={(e) => updateDraft({ street: e.target.value })}
                                        maxLength={120}
                                        placeholder="Nome da rua"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                                            {draft.data.semNumero ? 'Número (opcional)' : 'Número *'}
                                        </label>
                                        <input
                                            id="number"
                                            type="text"
                                            value={draft.data.number}
                                            disabled={draft.data.semNumero}
                                            onChange={(e) => updateDraft({ number: e.target.value.replace(/\D/g, '').slice(0, 25) })}
                                            maxLength={120}
                                            inputMode="numeric"
                                            placeholder="Nº"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30 disabled:bg-gray-100 disabled:text-gray-400"
                                        />
                                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer mt-1 select-none">
                                            <input
                                                type="checkbox"
                                                checked={draft.data.semNumero}
                                                onChange={(e) =>
                                                    updateDraft({
                                                        semNumero: e.target.checked,
                                                        number: e.target.checked ? '' : draft.data.number,
                                                    })}
                                                className="rounded border-gray-300"
                                                style={{ accentColor: '#ffce44' }}
                                            />
                                            Sem número
                                        </label>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="complement" className="block text-sm font-medium text-gray-700">Complemento</label>
                                        <input
                                            id="complement"
                                            type="text"
                                            value={draft.data.complement}
                                            onChange={(e) => updateDraft({ complement: e.target.value })}
                                            maxLength={120}
                                            placeholder="Apto, bloco..."
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/30"
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            {error && (
                                <p id="register-error" role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            {/* Aviso legal */}
                            <SignupLegalNotice />

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => persistDraft(createSignupDraft({ ...draft, step: 'basic' }))}
                                    className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 group flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-[.99] disabled:opacity-60"
                                    style={{ backgroundColor: '#ffce44' }}
                                >
                                    {submitting ? 'Continuando...' : 'Ir para a verificação'}
                                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                                        <IconArrow />
                                    </span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Rodapé link alternar login */}
                    <div className="text-center text-sm text-gray-500 mt-6">
                        <p>
                            Já tem uma conta?{' '}
                            <Link
                                href="/auth/login"
                                className="font-semibold text-gray-800 transition hover:underline"
                            >
                                Entre
                            </Link>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    )
}
