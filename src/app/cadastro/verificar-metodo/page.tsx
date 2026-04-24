'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Mail, ShieldCheck, Smartphone } from 'lucide-react'
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
    const hasTriggeredAutoCompleteRef = useRef(false)
    const isMountedRef = useRef(true)

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

    useEffect(() => {
        if (!draft?.emailVerified || hasTriggeredAutoCompleteRef.current) return

        hasTriggeredAutoCompleteRef.current = true
        setAutoCompleting(true)
        setError(null)

        const completeSignup = async () => {
            try {
                const persistedDraft = markSignupDraftEmailVerified('verify_method') ?? draft
                const result = await registerUserFromSignupDraft({
                    ...persistedDraft,
                    emailVerified: true,
                    step: 'verify_method',
                })
                await refresh()
                if (!isMountedRef.current) return
                if (result.isBroker && result.requiresBrokerDocuments) {
                    router.replace('/onboarding/broker?mode=signup')
                    return
                }
                router.replace(resolvePostAuthRoute(result, '/meus-imoveis'))
            } catch (signupError) {
                if (!isMountedRef.current) return
                hasTriggeredAutoCompleteRef.current = false
                setError(
                    signupError instanceof Error
                        ? signupError.message
                        : 'Não foi possível concluir o cadastro agora.',
                )
                setAutoCompleting(false)
            }
        }

        void completeSignup()
    }, [draft, refresh, router])

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
            <div className="min-h-[40vh] flex items-center justify-center text-slate-600 text-sm">
                Carregando…
            </div>
        )
    }

    const fromGoogle = draft.source === 'google'
    const canChooseEmail = !draft.emailVerified
    const showPhoneOption = !draft.emailVerified || error != null

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 text-center">Verificação da conta</h1>
                <p className="text-sm text-slate-600 text-center">
                    {draft.emailVerified
                        ? 'Seu e-mail já está confirmado. Estamos liberando a próxima etapa do cadastro.'
                        : fromGoogle
                            ? 'Seu e-mail já foi validado pelo Google. Escolha como deseja receber o código de confirmação.'
                            : 'Escolha receber o código por e-mail ou por SMS no telefone informado.'}
                </p>
                {draft.emailVerified && autoCompleting ? (
                    <div className="rounded-2xl border border-primary-100 bg-primary-50 px-5 py-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-900">E-mail confirmado</p>
                        <p className="mt-2 text-sm text-slate-600">Finalizando seu cadastro automaticamente...</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processando
                        </div>
                    </div>
                ) : (
                <div className="space-y-3">
                    {canChooseEmail && (
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
                    )}
                    {showPhoneOption && (
                        <button
                            type="button"
                            onClick={goPhone}
                            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-4 text-left hover:bg-slate-50 transition"
                        >
                            <Smartphone className="h-6 w-6 text-amber-600 shrink-0" />
                            <div>
                                <div className="font-semibold text-slate-900">Telefone (SMS)</div>
                                <div className="text-xs text-slate-600">
                                    {draft.emailVerified
                                        ? 'Opcional: use SMS se preferir continuar por telefone.'
                                        : 'Código por mensagem de texto'}
                                </div>
                            </div>
                        </button>
                    )}
                </div>
                )}
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
