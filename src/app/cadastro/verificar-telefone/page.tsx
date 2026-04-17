'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Smartphone } from 'lucide-react'

import { useUser } from '@/contexts/UserContext'
import { register, requestPhoneOtp, resendPhoneOtp, verifyPhoneOtp } from '@/lib/api/auth'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import {
    clearPendingPhoneUpdateDraft,
    clearSignupDraft,
    loadPendingPhoneUpdateDraft,
    loadSignupDraft,
    patchSignupDraft,
} from '@/lib/authSignupDraft'
import { updateProfile } from '@/lib/api/user'
import type { ApiError } from '@/lib/api/client'
import { formatPhoneInput, normalizePhoneDigits } from '@/lib/phoneInput'

export default function VerificarTelefonePage() {
    const cooldownSteps = [20, 60, 180, 300, 600, 1800, 3600, 10800]
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading, refresh } = useUser()

    const [phone, setPhone] = useState('')
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [signupDraftState, setSignupDraftState] = useState<ReturnType<typeof loadSignupDraft> | null>(null)
    const [pendingPhoneUpdateState, setPendingPhoneUpdateState] = useState<ReturnType<typeof loadPendingPhoneUpdateDraft> | null>(null)
    const [draftReady, setDraftReady] = useState(false)
    const [cooldownIndex, setCooldownIndex] = useState(0)
    const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const autoSendTriggeredRef = useRef(false)
    const autoSubmitScheduledRef = useRef(false)

    useEffect(() => {
        setSignupDraftState(loadSignupDraft())
        setPendingPhoneUpdateState(loadPendingPhoneUpdateDraft())
        setDraftReady(true)
    }, [])

    const isSignupFlow = !session && (searchParams.get('flow') === 'signup' || signupDraftState != null)
    const isProfileUpdateFlow = Boolean(session && (searchParams.get('mode') === 'profile-update' || pendingPhoneUpdateState != null))

    useEffect(() => {
        if (cooldownRemainingSeconds <= 0) return
        const timer = window.setInterval(() => {
            setCooldownRemainingSeconds((current) => (current > 0 ? current - 1 : 0))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [cooldownRemainingSeconds])

    useEffect(() => {
        if (!draftReady) return
        if (!loading && !session && !isSignupFlow) {
            router.replace('/auth/login?next=/cadastro/verificar-telefone')
            return
        }
        if (!loading && isSignupFlow && !signupDraftState) {
            router.replace('/auth/cadastro')
        }
        if (!loading && isProfileUpdateFlow && !pendingPhoneUpdateState) {
            router.replace('/perfil/editar')
        }
    }, [draftReady, isProfileUpdateFlow, isSignupFlow, loading, pendingPhoneUpdateState, router, session, signupDraftState])

    useEffect(() => {
        if (!draftReady || !isSignupFlow || !signupDraftState) return
        if (signupDraftState.step === 'verify_method') {
            router.replace('/cadastro/verificar-metodo')
        }
    }, [draftReady, isSignupFlow, router, signupDraftState])

    useEffect(() => {
        const phoneFromQuery = searchParams.get('phone')
        if (phoneFromQuery) {
            setPhone(formatPhoneInput(phoneFromQuery))
            return
        }
        if (isProfileUpdateFlow && pendingPhoneUpdateState?.phone) {
            setPhone(formatPhoneInput(pendingPhoneUpdateState.phone))
            return
        }
        if (isSignupFlow && signupDraftState?.data.phone) {
            setPhone(formatPhoneInput(signupDraftState.data.phone))
            return
        }
        const phoneFromSession = session?.user.phone
        if (phoneFromSession) {
            setPhone(formatPhoneInput(phoneFromSession))
        }
    }, [isProfileUpdateFlow, isSignupFlow, pendingPhoneUpdateState, searchParams, session, signupDraftState])

    useEffect(() => {
        const isComplete = code.every((digit) => digit.trim().length === 1)
        if (!isComplete || verifying || success || autoSubmitScheduledRef.current) {
            return
        }
        autoSubmitScheduledRef.current = true
        const timeout = window.setTimeout(() => {
            autoSubmitScheduledRef.current = false
            void handleVerify()
        }, 0)
        return () => window.clearTimeout(timeout)
    }, [code, verifying, success])

    useEffect(() => {
        if (!draftReady || autoSendTriggeredRef.current) return
        const normalizedPhone = normalizePhoneDigits(phone)
        if (!normalizedPhone || normalizedPhone.length < 10) return
        autoSendTriggeredRef.current = true
        void handleSendOtp(false, true)
    }, [draftReady, phone])

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const next = [...code]
        next[index] = value
        setCode(next)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
        if (event.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleSendOtp = async (isResend = false, silent = false) => {
        const normalizedPhone = normalizePhoneDigits(phone)
        if (!normalizedPhone || normalizedPhone.length < 10) {
            setError('Informe um telefone válido antes de continuar.')
            return
        }
        if (cooldownRemainingSeconds > 0 && isResend) return

        setSending(true)
        setError(null)
        try {
            const response = sessionToken
                ? await resendPhoneOtp(sessionToken)
                : await requestPhoneOtp(normalizedPhone)
            setSessionToken(response.sessionToken)
            const nextIndex = isResend
                ? Math.min(cooldownIndex + 1, cooldownSteps.length - 1)
                : cooldownIndex
            setCooldownIndex(nextIndex)
            setCooldownRemainingSeconds(cooldownSteps[nextIndex])
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Não foi possível enviar o código por SMS.')
            if (!silent) {
                setSessionToken(null)
            }
        } finally {
            setSending(false)
        }
    }

    const handlePaste = (event: React.ClipboardEvent) => {
        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (!pasted) return
        event.preventDefault()
        const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '')
        setCode(next)
    }

    const finishProfileUpdate = async () => {
        if (!pendingPhoneUpdateState) {
            router.push('/perfil/editar')
            return
        }

        await updateProfile(pendingPhoneUpdateState.payload)
        clearPendingPhoneUpdateDraft()
        await refresh()
        router.push('/perfil/editar?saved=1')
    }

    const finishSignup = async () => {
        if (!signupDraftState || !signupDraftState.userType) {
            router.push('/auth/cadastro')
            return
        }

        const normalizedPhone = normalizePhoneDigits(phone)
        const nextDraft = patchSignupDraft({
            phoneVerified: true,
            data: { phone: formatPhoneInput(phone) },
        })
        const signupProfileType = nextDraft.userType === 'broker' ? 'broker' : 'client'

        const result = await register({
            name: nextDraft.data.name.trim(),
            email: nextDraft.data.email.trim().toLowerCase(),
            password: nextDraft.data.password,
            profileType: signupProfileType,
            creci: signupProfileType === 'broker' ? nextDraft.data.creci.trim().toUpperCase() : undefined,
            googleIdToken: nextDraft.source === 'google' ? nextDraft.data.googleIdToken : undefined,
            phone: normalizedPhone || undefined,
            cep: nextDraft.data.cep.replace(/\D/g, '') || undefined,
            street: nextDraft.data.street.trim() || undefined,
            number: nextDraft.data.number.trim() || undefined,
            withoutNumber: nextDraft.data.semNumero ? true : undefined,
            complement: nextDraft.data.complement.trim() || undefined,
            bairro: nextDraft.data.bairro.trim() || undefined,
            city: nextDraft.data.city.trim() || undefined,
            state: nextDraft.data.state.trim().toUpperCase() || undefined,
        })

        clearSignupDraft()
        await refresh()

        if (result.isBroker && result.requiresBrokerDocuments) {
            router.push('/onboarding/broker?mode=signup')
            return
        }

        router.push(resolvePostAuthRoute(result, '/meus-imoveis'))
    }

    const handleVerify = async () => {
        autoSubmitScheduledRef.current = false
        const fullCode = code.join('')
        if (!sessionToken || fullCode.length !== 6) {
            setError('Informe o código completo de 6 dígitos.')
            return
        }

        setVerifying(true)
        setError(null)
        try {
            await verifyPhoneOtp(sessionToken, fullCode)
            setSuccess(true)

            if (isProfileUpdateFlow) {
                await finishProfileUpdate()
                return
            }

            if (isSignupFlow) {
                await finishSignup()
                return
            }

            setTimeout(() => {
                if (!session) {
                    router.push('/onboarding')
                    return
                }
                router.push(resolvePostAuthRoute(session, '/onboarding'))
            }, 1500)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 409) {
                setError('Já existe uma conta usando este telefone.')
            } else {
                setError(apiErr?.message || 'Não foi possível validar o código informado.')
            }
        } finally {
            setVerifying(false)
        }
    }

    if ((loading && !isSignupFlow) || !draftReady) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-sm text-slate-600">Carregando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                {success ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Telefone validado</h1>
                        <p className="text-sm text-slate-600">
                            {isSignupFlow
                                ? 'Concluindo seu cadastro...'
                                : isProfileUpdateFlow
                                    ? 'Salvando seu novo telefone...'
                                    : 'Redirecionando para continuar seu perfil...'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 text-center">
                            <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                                <Smartphone className="w-7 h-7 text-primary-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Verificar telefone</h1>
                            <p className="text-sm text-slate-600">
                                Confirme seu número com um código de 6 dígitos enviado por SMS.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                                Telefone
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                                maxLength={19}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="+55 (00) 00000-0000"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => handleSendOtp(Boolean(sessionToken))}
                            disabled={sending || verifying || (Boolean(sessionToken) && cooldownRemainingSeconds > 0)}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {sending
                                ? 'Enviando...'
                                : sessionToken && cooldownRemainingSeconds > 0
                                    ? `Reenviar em ${cooldownRemainingSeconds}s`
                                    : sessionToken
                                        ? 'Reenviar código'
                                        : 'Enviar código por SMS'}
                        </button>

                        {sessionToken && (
                            <div className="space-y-5">
                                <div className="flex justify-center gap-2" aria-label="Código de telefone" onPaste={handlePaste}>
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(element) => {
                                                inputRefs.current[index] = element
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(event) => handleCodeChange(index, event.target.value)}
                                            onKeyDown={(event) => handleKeyDown(index, event)}
                                            className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                                >
                                    {verifying ? 'Validando...' : 'Confirmar telefone'}
                                </button>
                            </div>
                        )}

                        {error && (
                            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
                                {error}
                            </p>
                        )}

                        <div className="text-center">
                            <Link
                                href={
                                    isProfileUpdateFlow
                                        ? '/perfil/editar'
                                        : isSignupFlow
                                            ? '/cadastro/verificar-metodo'
                                            : '/onboarding'
                                }
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {isProfileUpdateFlow
                                    ? 'Voltar ao perfil'
                                    : isSignupFlow
                                        ? 'Trocar método de verificação'
                                        : 'Voltar ao onboarding'}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
