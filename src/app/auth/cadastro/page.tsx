'use client'

import { useEffect, useMemo, useState } from 'react'
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

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const STEP_LABELS = ['Perfil', 'Dados básicos', 'Endereço'] as const

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
        draft.data.cep.replace(/\D/g, '') &&
        draft.data.street.trim() &&
        (draft.data.semNumero || draft.data.number.trim()) &&
        draft.data.bairro.trim() &&
        draft.data.city.trim() &&
        draft.data.state.trim(),
    )
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
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (session) {
            router.replace(resolvePostAuthRoute(session, '/meus-imoveis'))
            return
        }

        const existing = loadSignupDraft()
        if (existing) {
            if (
                existing.step === 'verify_method' ||
                existing.step === 'email' ||
                existing.step === 'phone' ||
                existing.step === 'documents'
            ) {
                router.replace(resolveSignupDraftHref(existing))
                return
            }
            setDraft(existing)
            setRestoredDraft(true)
        }
        setReady(true)
    }, [router, session])

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

    const isGoogleFlow = draft.source === 'google'
    const isLoading = submitting || googleLoading

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

    const handleCepBlur = async () => {
        const cleanCep = draft.data.cep.replace(/\D/g, '')
        if (cleanCep.length !== 8) return

        setCepLoading(true)
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()
            if (!data.erro) {
                updateDraft({
                street: data.logradouro || draft.data.street,
                bairro: data.bairro || draft.data.bairro,
                city: data.localidade || draft.data.city,
                state: data.uf || draft.data.state,
            })
            }
        } catch {
            // Usuário ainda pode preencher manualmente.
        } finally {
            setCepLoading(false)
        }
    }

    const handleGoogleRegister = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            const result = await loginWithGooglePopup()
            if (isGooglePendingAuthResult(result)) {
                const googleDraft = createSignupDraft({
                    source: 'google',
                    step: 'profile',
                    emailVerified: true,
                    data: {
                        email: result.pending.email,
                        name: result.pending.name,
                        googleIdToken: result.pending.googleIdToken,
                        googleUid: result.pending.googleUid,
                        state: 'GO',
                    },
                })
                persistDraft(googleDraft)
                setRestoredDraft(false)
                return
            }
            await refresh()
            router.push(resolvePostAuthRoute(result, '/meus-imoveis'))
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Erro ao conectar com o Google. Tente novamente.')
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
        setError(null)
        setDraft(next)
    }

    const handleContinueBasic = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

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
            setDraft(next)
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Não foi possível validar seus dados agora.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleContinueAddress = (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

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

        persistDraft(next)
        router.push(resolveSignupDraftHref(next))
    }

    const handleDiscardDraft = () => {
        clearSignupDraft()
        setDraft(createSignupDraft({ step: 'profile', data: { state: 'GO' } }))
        setRestoredDraft(false)
        setError(null)
    }

    if (!ready) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando cadastro...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
                    <p className="text-sm text-slate-600">
                        Siga as mesmas etapas do app para concluir seu cadastro com segurança.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {STEP_LABELS.map((label, index) => (
                        <div
                            key={label}
                            className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                                index === stepIndex
                                    ? 'bg-primary-600 text-white'
                                    : index < stepIndex
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            {label}
                        </div>
                    ))}
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

                {!isGoogleFlow && stepIndex === 0 && (
                    <>
                        <button
                            type="button"
                            onClick={handleGoogleRegister}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {googleLoading ? 'Conectando...' : 'Continuar com Google'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-400">ou com e-mail</span>
                            </div>
                        </div>
                    </>
                )}

                {stepIndex === 0 && (
                    <form onSubmit={handleContinueProfile} className="space-y-4" aria-describedby={error ? 'register-error' : undefined}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => updateDraft({}, { userType: 'client' })}
                                className={`rounded-2xl border p-5 text-left transition-colors ${
                                    draft.userType === 'client'
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-slate-200 bg-white hover:border-primary-300'
                                }`}
                            >
                                <p className="text-sm font-semibold text-slate-900">Quero cadastrar como cliente</p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Para favoritar imóveis, gerar propostas e acompanhar contratos.
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => updateDraft({}, { userType: 'broker' })}
                                className={`rounded-2xl border p-5 text-left transition-colors ${
                                    draft.userType === 'broker'
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-slate-200 bg-white hover:border-primary-300'
                                }`}
                            >
                                <p className="text-sm font-semibold text-slate-900">Quero cadastrar como corretor</p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Para anunciar imóveis, gerar propostas e operar a carteira.
                                </p>
                            </button>
                        </div>

                        {error && (
                            <p id="register-error" role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!draft.userType}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            Continuar
                        </button>
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
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    maxLength={256}
                                    value={draft.data.password}
                                    onChange={(e) => updateDraft({ password: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                    >
                                        {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
                                maxLength={19}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="+55 (00) 00000-0000"
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
                                    <label htmlFor="cep" className="block text-xs font-medium text-slate-600">CEP *</label>
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
                                    <label htmlFor="city" className="block text-xs font-medium text-slate-600">Cidade *</label>
                                    <input
                                        id="city"
                                        type="text"
                                        value={draft.data.city}
                                        onChange={(e) => updateDraft({ city: e.target.value })}
                                        maxLength={25}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Sua cidade"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="bairro" className="block text-xs font-medium text-slate-600">Bairro *</label>
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
                                <label htmlFor="street" className="block text-xs font-medium text-slate-600">Rua *</label>
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
                                {submitting ? 'Continuando...' : isGoogleFlow ? 'Ir para verificação do telefone' : 'Ir para verificação do e-mail'}
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
