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

function hasRequiredAddress(draft: SignupDraft) {
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
    if (
        (code === 'CRECI_INVALID' || code === 'DRAFT_CRICI_INVALID')
        && ['basic', 'address', 'verify_method', 'documents', 'email', 'phone'].includes(step)
    ) {
        return 'CRECI inválido.'
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
            data: { state: 'GO' },
        }),
    )
    const [ready, setReady] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cepLoading, setCepLoading] = useState(false)
    const [restoredDraft, setRestoredDraft] = useState(false)
    const [draftConflictCode, setDraftConflictCode] = useState<DraftConflictCode | null>(null)
    const [showPassword, setShowPassword] = useState(false)
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
            const shouldGoDirectToBasic = existing.userType && existing.step === 'profile'
            const restored = shouldGoDirectToBasic
                ? createSignupDraft({ ...existing, step: 'basic' })
                : existing

            if (shouldGoDirectToBasic) {
                saveSignupDraft(restored)
            }

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
            setRestoredDraft(true)
        }
        setReady(true)
    }, [router.replace, router.push, session])

    const stepIndex = useMemo(() => {
        switch (draft.step) {
            case 'profile':
                return 0
            case 'basic':
                return 1
            default:
                return 2
        }
    }, [draft.step])
    const stepSubtitle = useMemo(() => {
        if (draft.step === 'profile') return STEP_SUBTITLES.profile
        if (draft.step === 'basic') return STEP_SUBTITLES.basic
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
        const normalizedCreci = next.data.creci.trim()
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
                let googleDraft = createSignupDraft({
                    ...draft,
                    source: 'google',
                    step: draft.userType ? 'basic' : 'profile',
                    userType: draft.userType,
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

                if (googleDraft.userType) {
                    const hasRemoteDraft = Boolean(googleDraft.draftId && googleDraft.draftToken)
                    const shouldCreateDraftRemotely = googleDraft.userType === 'client'
                    if (hasRemoteDraft || shouldCreateDraftRemotely) {
                        googleDraft = await syncDraftWithServer(googleDraft, {
                            remoteStep: 'profile',
                        })
                    }
                }

                persistDraft(googleDraft)
                setRestoredDraft(false)
                setError(null)
                if (googleDraft.userType) {
                    setDraft(googleDraft)
                }
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
                const code = String(apiErr?.payload?.code || '').toUpperCase()
                const message = String(apiErr?.message || '').toLowerCase()
                if (
                    code === 'CRECI_INVALID'
                    || code === 'CRECI_MISSING'
                    || code === 'DRAFT_CRICI_INVALID'
                    || message.includes('creci')
                ) {
                    setError('Não foi possível concluir o cadastro. Tente novamente.')
                    return
                }
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
        if (normalizePhone(phone).length < 10) {
            setError('Informe um telefone válido.')
            setSubmitting(false)
            return
        }
        if (draft.userType === 'broker' && !creci.trim()) {
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
                const creciStatus = await checkCreci(creci.trim().toUpperCase())
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
                    creci: creci.trim().toUpperCase(),
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

    return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-3 pt-24 pb-10 sm:px-4 sm:pt-36 sm:pb-16 bg-gradient-to-b from-slate-50/95 to-slate-100/95">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-4 sm:p-8 space-y-5 sm:space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Criar conta</h1>
                    <p className="text-xs sm:text-sm text-slate-600 px-1">
                        {stepSubtitle}
                    </p>
                </div>

                {restoredDraft && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <p className="font-semibold">Rascunho restaurado</p>
                        <p className="mt-1">Retomamos o seu cadastro de onde ele parou.</p>
                        <button
                            type="button"
                            onClick={handleDiscardDraft}
                            className="mt-3 inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            Descartar cadastro
                        </button>
                    </div>
                )}

                {draftConflictCode && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {draftConflictCode === 'emailAlreadyRegistered' && (
                            <>
                                <p className="font-semibold">E-mail já cadastrado</p>
                                <p className="mt-1">
                                    Encontramos uma conta existente para esse e-mail. Faça login para continuar.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link href="/auth/login" className="inline-flex rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700">
                                        Entrar
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleDiscardDraft}
                                        className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                                    >
                                        Descartar cadastro
                                    </button>
                                </div>
                            </>
                        )}
                        {draftConflictCode === 'draftAlreadyExists' && (
                            <>
                                <p className="font-semibold">Cadastro em andamento</p>
                                <p className="mt-1">
                                    Já existe um cadastro em andamento para este e-mail. Você pode continuar ou descartá-lo.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleResumeDraft}
                                        className="inline-flex rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                                    >
                                        Continuar cadastro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDiscardDraft}
                                        className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                                    >
                                        Descartar cadastro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSwitchAccount}
                                        className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                                    >
                                        Trocar de conta
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {stepIndex === 0 && (
                    <form onSubmit={handleContinueProfile} className="space-y-4" aria-describedby={error ? 'register-error' : undefined}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {selectionCards.map((option) => {
                                const isSelected = draft.userType === option.value
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isSelected}
                                        aria-describedby={`signup-role-${option.value}-hint`}
                                        onClick={() => handleSelectProfile(option.value)}
                                        className={`group relative cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20 sm:p-5 ${
                                            isSelected
                                                ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-500/30 shadow-primary-200/60'
                                                : 'border-slate-200 bg-white hover:border-primary-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-600">
                                                    {option.description}
                                                </p>
                                            </div>
                                            <span
                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                    isSelected
                                                        ? 'border-primary-600 bg-primary-600 text-white'
                                                        : 'border-slate-300 bg-white text-transparent group-hover:border-primary-400'
                                                }`}
                                                aria-hidden="true"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                        <p
                                            id={`signup-role-${option.value}-hint`}
                                            className={`mt-3 text-xs font-medium ${
                                                isSelected ? 'text-primary-700' : 'text-slate-500'
                                            }`}
                                        >
                                            {isSelected ? 'Escolha aplicada. Continue para preencher seus dados.' : option.helper}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>

                        {!isGoogleFlow && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] sm:text-xs uppercase tracking-wide">
                                        <span className="bg-white px-3 text-slate-400">ou continue com</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleRegister}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors min-h-[44px]"
                                >
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    {googleLoading ? 'Conectando...' : 'Continuar com Google'}
                                </button>
                            </>
                        )}

                        {error && (
                            <p id="register-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!draft.userType}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-3 sm:py-2.5 shadow-md shadow-primary-500/20 transition-colors min-h-[48px] sm:min-h-0"
                        >
                            Continuar
                        </button>
                        {draftConflictCode === 'draftAlreadyExists' && (
                            <button
                                type="button"
                                onClick={handleSwitchAccount}
                                className="mt-2 w-full inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Trocar de conta
                            </button>
                        )}
                    </form>
                )}

                {stepIndex === 1 && (
                    <form onSubmit={handleContinueBasic} className="space-y-4" aria-describedby={error ? 'register-error' : undefined}>
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome completo *</label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={draft.data.name}
                                onChange={(e) => updateDraft({ name: e.target.value })}
                                maxLength={120}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail *</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isGoogleFlow}
                                value={draft.data.email}
                                onChange={(e) => updateDraft({ email: e.target.value })}
                                maxLength={120}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="voce@exemplo.com"
                            />
                        </div>

                        {!isGoogleFlow && (
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Senha *</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        minLength={6}
                                        maxLength={256}
                                        value={draft.data.password}
                                        onChange={(e) => updateDraft({ password: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 pl-3 pr-11 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Telefone *</label>
                            <input
                                id="phone"
                                type="tel"
                                required
                                value={draft.data.phone}
                                onChange={(e) => updateDraft({ phone: formatPhoneInput(e.target.value) })}
                                maxLength={15}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        {draft.userType === 'broker' && (
                            <div className="space-y-1.5">
                                <label htmlFor="creci" className="block text-sm font-medium text-slate-700">CRECI *</label>
                                <input
                                    id="creci"
                                    type="text"
                                    required
                                    value={draft.data.creci}
                                    onChange={(e) => updateDraft({ creci: e.target.value.toUpperCase() })}
                                    maxLength={25}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Ex: 12345-F"
                                />
                            </div>
                        )}

                        {error && (
                            <p id="register-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => persistDraft(createSignupDraft({ ...draft, step: 'profile' }))}
                                className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Validando...' : 'Continuar'}
                            </button>
                        </div>
                    </form>
                )}

                {stepIndex === 2 && (
                    <form onSubmit={handleContinueAddress} className="space-y-4" aria-describedby={error ? 'register-error' : undefined}>
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-semibold text-slate-800">Endereço</legend>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                <label htmlFor="cep" className="block text-xs font-medium text-slate-600">CEP (opcional)</label>
                                    <input
                                        id="cep"
                                        type="text"
                                        value={formatCep(draft.data.cep)}
                                        onChange={(e) => updateDraft({ cep: formatCep(e.target.value) })}
                                        onBlur={handleCepBlur}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="00000-000"
                                    />
                                    {cepLoading && <p role="status" aria-live="polite" className="text-xs text-primary-500">Buscando CEP...</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="state" className="block text-xs font-medium text-slate-600">Estado *</label>
                                    <select
                                        id="state"
                                        value={draft.data.state}
                                        onChange={(e) => updateDraft({ state: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">UF</option>
                                        {BRAZILIAN_STATES.map((uf) => (
                                            <option key={uf} value={uf}>{uf}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                <label htmlFor="city" className="block text-xs font-medium text-slate-600">Cidade</label>
                                    <input
                                        id="city"
                                        type="text"
                                        list="signup-city-options"
                                        value={draft.data.city}
                                        onChange={(e) => updateDraft({ city: e.target.value })}
                                        maxLength={25}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder={citiesLoading ? 'Carregando cidades...' : 'Sua cidade'}
                                    />
                                    <datalist id="signup-city-options">
                                        {cityOptions.map((option) => (
                                            <option key={option} value={option} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro</label>
                                    <input
                                        id="bairro"
                                        type="text"
                                        value={draft.data.bairro}
                                        onChange={(e) => updateDraft({ bairro: e.target.value })}
                                        maxLength={120}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Bairro"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua</label>
                                <input
                                    id="street"
                                    type="text"
                                    value={draft.data.street}
                                    onChange={(e) => updateDraft({ street: e.target.value })}
                                    maxLength={120}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nome da rua"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="number" className="block text-xs font-medium text-slate-600">
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
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder="Nº"
                                    />
                                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={draft.data.semNumero}
                                            onChange={(e) =>
                                                updateDraft({
                                                    semNumero: e.target.checked,
                                                    number: e.target.checked ? '' : draft.data.number,
                                                })}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Sem número
                                    </label>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="complement" className="block text-xs font-medium text-slate-600">Complemento</label>
                                    <input
                                        id="complement"
                                        type="text"
                                        value={draft.data.complement}
                                        onChange={(e) => updateDraft({ complement: e.target.value })}
                                        maxLength={120}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Apto, bloco..."
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {error && (
                            <p id="register-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => persistDraft(createSignupDraft({ ...draft, step: 'basic' }))}
                                className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Continuando...' : 'Ir para a página de verificação'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center text-sm text-slate-600 space-y-1.5">
                    <p>
                        Já tem conta?{' '}
                        <Link
                            href="/auth/login"
                            className="font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
