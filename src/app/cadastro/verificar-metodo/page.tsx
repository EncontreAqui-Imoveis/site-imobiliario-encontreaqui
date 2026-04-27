'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Mail, Smartphone } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'

import {
    loadSignupDraft,
    markSignupDraftEmailVerified,
    resolveSignupDraftHref,
    rewindSignupDraftToAddress,
    saveSignupDraft,
    type SignupDraft,
} from '@/lib/authSignupDraft'
import { registerUserFromSignupDraft } from '@/lib/registerFromSignupDraft'

export default function VerificarMetodoPage() {
    const router = useRouter()
    const { refresh } = useUser()
    const [draft, setDraft] = useState<SignupDraft | null>(null)
    const [autoCompleting, setAutoCompleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isMountedRef = useRef(true)
    const isBrokerSignup = draft?.userType === 'broker'
    const signupCreci = draft?.data.creci.trim() ?? ''

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        const d = loadSignupDraft()
        if (!d) {
            router.replace('/auth/cadastro')
            return
        }
        if (d.step === 'profile' || d.step === 'basic' || d.step === 'address') {
            router.replace('/auth/cadastro')
            return
        }
        if (d.step === 'documents') {
            router.replace(resolveSignupDraftHref(d))
            return
        }
        if (d.step === 'email' || d.step === 'phone') {
            const next: SignupDraft = {
                ...d,
                step: 'verify_method',
                updatedAt: new Date().toISOString(),
            }
            saveSignupDraft(next)
            setDraft(next)
            return
        }
        if (d.step === 'verify_method') {
            setDraft(d)
            return
        }
        router.replace('/auth/cadastro')
    }, [router])

    const finalizeClientSignup = async () => {
        if (!draft) {
            setError('Não foi possível carregar o cadastro em andamento. Tente novamente.')
            return
        }
        setAutoCompleting(true)
        setError(null)

        try {
            if (draft.userType === 'broker') {
                const params = new URLSearchParams({ mode: 'signup' })
                if (signupCreci) {
                    params.set('creci', signupCreci.toUpperCase())
                }
                router.replace(`/onboarding/broker?${params.toString()}`)
                return
            }

            const persistedDraft = markSignupDraftEmailVerified('verify_method') ?? draft
            const result = await registerUserFromSignupDraft({
                ...persistedDraft,
                emailVerified: true,
                step: 'verify_method',
            })
            await refresh()
            if (!isMountedRef.current) return
            router.replace(resolvePostAuthRoute(result, '/meus-imoveis'))
        } catch (signupError) {
            if (!isMountedRef.current) return
            setError(
                signupError instanceof Error
                    ? signupError.message
                    : 'Não foi possível concluir o cadastro agora.',
            )
        } finally {
            if (isMountedRef.current) {
                setAutoCompleting(false)
            }
        }
    }

    const handleSkipPhoneVerification = async () => {
        await finalizeClientSignup()
    }

    const goEmail = () => {
        if (!draft) return
        const next: SignupDraft = { ...draft, step: 'email', updatedAt: new Date().toISOString() }
        saveSignupDraft(next)
        router.push(resolveSignupDraftHref(next))
    }

    const goPhone = () => {
        if (!draft) return
        const next: SignupDraft = { ...draft, step: 'phone', updatedAt: new Date().toISOString() }
        saveSignupDraft(next)
        router.push(resolveSignupDraftHref(next))
    }

    const goBackToAddress = () => {
        const next = rewindSignupDraftToAddress()
        if (!next) {
            router.push('/auth/cadastro')
            return
        }
        router.push('/auth/cadastro')
    }

    if (!draft) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-slate-600 text-sm">
                Carregando…
            </div>
        )
    }

    const fromGoogle = draft.source === 'google'
    const requiresEmailMethod = !draft.emailVerified

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-3 pt-24 pb-10 sm:px-4 sm:pt-36 sm:pb-16 bg-gradient-to-b from-slate-50/95 to-slate-100/95">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 text-center">Verificação da conta</h1>
                <p className="text-sm text-slate-600 text-center">
                    {draft.emailVerified
                ? 'Seu e-mail já foi verificado. Você quer verificar seu telefone?'
                        : fromGoogle
                            ? 'Seu e-mail já foi validado pelo Google. Escolha como deseja receber o código de confirmação.'
                            : 'Escolha receber o código por e-mail ou por SMS no telefone informado.'}
                </p>
                <div className="space-y-3">
                    {requiresEmailMethod ? (
                        <>
                            <button
                                type="button"
                                onClick={goEmail}
                                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-4 text-left hover:bg-slate-50 transition"
                            >
                                <Mail className="h-6 w-6 text-amber-600 shrink-0" />
                                <div>
                                    <div className="font-semibold text-slate-900">E-mail</div>
                                    <div className="text-xs text-slate-600">Código de 6 dígitos no seu e-mail</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={goPhone}
                                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-4 text-left hover:bg-slate-50 transition"
                            >
                                <Smartphone className="h-6 w-6 text-amber-600 shrink-0" />
                                <div>
                                    <div className="font-semibold text-slate-900">Telefone (SMS)</div>
                                    <div className="text-xs text-slate-600">Código por mensagem de texto</div>
                                </div>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={goPhone}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
                                disabled={autoCompleting}
                            >
                                Sim, verificar por SMS
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSkipPhoneVerification()}
                                className="w-full rounded-xl bg-primary-600 text-white px-4 py-3 font-semibold hover:bg-primary-700 transition disabled:opacity-60"
                                disabled={autoCompleting}
                            >
                                {autoCompleting
                                    ? isBrokerSignup
                                        ? 'Prosseguindo com a verificação...'
                                        : 'Finalizando cadastro...'
                                    : isBrokerSignup
                                        ? 'Prosseguir com verificação de corretor'
                                        : 'Não, continuar sem verificar'}
                            </button>
                        </>
                    )}
                </div>
                {error && (
                    <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                <button
                    type="button"
                    onClick={goBackToAddress}
                    className="flex w-full items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar e revisar endereço
                </button>
            </div>
        </div>
    )
}
