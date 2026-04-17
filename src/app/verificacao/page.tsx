'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { sendEmailVerificationCode, verifyEmailCode } from '@/lib/api/auth'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import { loadSignupDraft, patchSignupDraft } from '@/lib/authSignupDraft'
import type { ApiError } from '@/lib/api/client'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function VerificacaoPage() {
    const DAILY_LIMIT = 5
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading, refresh } = useUser()

    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | null>(null)
    const [verificationExpired, setVerificationExpired] = useState(false)
    const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0)
    const [dailySendCount, setDailySendCount] = useState(0)
    const [dailyWindowStartedAt, setDailyWindowStartedAt] = useState<Date | null>(null)
    const [signupDraftEmail, setSignupDraftEmail] = useState<string | null>(null)
    const [draftReady, setDraftReady] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const autoSendTriggeredRef = useRef(false)
    const autoSubmitScheduledRef = useRef(false)

    useEffect(() => {
        const signupDraft = loadSignupDraft()
        setSignupDraftEmail(signupDraft?.data.email ?? null)
        setDraftReady(true)
    }, [])

    const isSignupFlow = !session && (searchParams.get('flow') === 'signup' || signupDraftEmail != null)
    const email = isSignupFlow ? signupDraftEmail ?? '' : session?.user.email || ''
    const dailyLimitReached = (() => {
        if (!dailyWindowStartedAt) return false
        if (Date.now() - dailyWindowStartedAt.getTime() >= 24 * 60 * 60 * 1000) return false
        return dailySendCount >= DAILY_LIMIT
    })()

    useEffect(() => {
        if (!draftReady) return
        if (!loading && !session && !isSignupFlow) {
            router.replace('/auth/login?next=/verificacao')
            return
        }
        if (!loading && isSignupFlow && !email) {
            router.replace('/auth/cadastro')
        }
    }, [draftReady, email, isSignupFlow, loading, router, session])

    useEffect(() => {
        if (!draftReady || !isSignupFlow) return
        const d = loadSignupDraft()
        if (d?.step === 'verify_method') {
            router.replace('/cadastro/verificar-metodo')
        }
    }, [draftReady, isSignupFlow, router])

    useEffect(() => {
        if (!verificationExpiresAt && cooldownRemainingSeconds === 0) return
        const timer = window.setInterval(() => {
            setCooldownRemainingSeconds((current) => (current > 0 ? current - 1 : 0))
            setVerificationExpired((current) => {
                if (!verificationExpiresAt) return current
                return Date.now() > verificationExpiresAt.getTime()
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [cooldownRemainingSeconds, verificationExpiresAt])

    useEffect(() => {
        if (!draftReady || !email || autoSendTriggeredRef.current) return
        autoSendTriggeredRef.current = true
        void handleSendCode(true)
    }, [draftReady, email])

    useEffect(() => {
        const isComplete = code.every((digit) => digit.trim().length === 1)
        if (
            !isComplete ||
            submitting ||
            success ||
            verificationExpired ||
            autoSubmitScheduledRef.current
        ) {
            return
        }

        autoSubmitScheduledRef.current = true
        const timeout = window.setTimeout(() => {
            autoSubmitScheduledRef.current = false
            void handleVerify()
        }, 0)

        return () => window.clearTimeout(timeout)
    }, [code, submitting, success, verificationExpired])

    const handleSendCode = async (silent = false) => {
        if (!email) return
        setResending(true)
        setError(null)
        try {
            const response = await sendEmailVerificationCode(email)
            const now = new Date()
            setCodeSent(true)
            setVerificationExpired(false)
            setVerificationExpiresAt(response.expires_at ? new Date(response.expires_at) : null)
            setCooldownRemainingSeconds(Number(response.cooldown_sec ?? 0))
            setDailyWindowStartedAt((current) => current ?? now)
            setDailySendCount(DAILY_LIMIT - Number(response.daily_remaining ?? DAILY_LIMIT))

            if (response.delivery === 'already_verified') {
                setSuccess(true)
                if (isSignupFlow) {
                    patchSignupDraft({ emailVerified: true, step: 'phone' })
                    window.setTimeout(() => {
                        router.push('/cadastro/verificar-telefone?flow=signup')
                    }, 1200)
                }
            }
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 429) {
                setError('Muitas tentativas. Aguarde e tente novamente.')
            } else {
                setError('Erro ao enviar código. Tente novamente.')
            }
            if (!silent) {
                setCodeSent(false)
            }
        } finally {
            setResending(false)
        }
    }

    const handleCodeChange = (index: number, value: string) => {
        const sanitized = value.replace(/\D/g, '')
        if (sanitized.length > 1) {
            const next = [...code]
            for (let offset = 0; offset < sanitized.length; offset += 1) {
                const target = index + offset
                if (target >= next.length) break
                next[target] = sanitized[offset]
            }
            setCode(next)
            const nextIndex = Math.min(index + sanitized.length, 5)
            inputRefs.current[nextIndex]?.focus()
            return
        }
        if (!/^\d?$/.test(sanitized)) return
        const newCode = [...code]
        newCode[index] = sanitized
        setCode(newCode)

        if (sanitized && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (event: React.ClipboardEvent) => {
        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (!pasted) return
        event.preventDefault()
        const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '')
        setCode(next)
    }

    const handleVerify = async () => {
        autoSubmitScheduledRef.current = false
        const fullCode = code.join('')
        if (fullCode.length !== 6) {
            setError('Insira o código completo de 6 dígitos.')
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            await verifyEmailCode(email, fullCode)
            setSuccess(true)

            if (isSignupFlow) {
                patchSignupDraft({ emailVerified: true, step: 'phone' })
                setTimeout(() => {
                    router.push('/cadastro/verificar-telefone?flow=signup')
                }, 1500)
                return
            }

            await refresh()
            setTimeout(() => {
                if (!session) {
                    router.push('/meus-imoveis')
                    return
                }
                const refreshedSession = {
                    ...session,
                    user: {
                        ...session.user,
                        email_verified: true,
                    },
                }
                router.push(resolvePostAuthRoute(refreshedSession, '/meus-imoveis'))
            }, 2000)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 410) {
                setError('Código expirado. Solicite um novo.')
            } else if ('status' in apiErr && apiErr.status === 423) {
                setError('Você atingiu o limite de tentativas. Solicite um novo código.')
            } else if ('status' in apiErr && apiErr.status === 400) {
                setError('Código inválido. Revise os 6 dígitos e tente novamente.')
            } else {
                setError('Erro ao verificar código. Tente novamente.')
            }
        } finally {
            setSubmitting(false)
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
                        <h1 className="text-2xl font-bold text-slate-900">
                            Conta verificada!
                        </h1>
                        <p className="text-sm text-slate-600">
                            {isSignupFlow ? 'Seguindo para a verificação do telefone...' : 'Redirecionando...'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 text-center">
                            <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-primary-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Verificar conta
                            </h1>
                            <p className="text-sm text-slate-600">
                                Enviaremos um código de 6 dígitos para <strong>{email}</strong>
                            </p>
                        </div>

                        {!codeSent ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                {resending ? 'Enviando o código automaticamente...' : 'Preparando o envio do código...'}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex justify-center gap-2" aria-label="Código de verificação" onPaste={handlePaste}>
                                    {code.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            aria-label={`Dígito ${i + 1} do código`}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={handleVerify}
                                    disabled={submitting}
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                                >
                                    {submitting ? 'Verificando...' : 'Verificar'}
                                </button>

                                <button
                                    onClick={() => handleSendCode()}
                                    disabled={resending || dailyLimitReached || cooldownRemainingSeconds > 0}
                                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                >
                                    {resending
                                        ? 'Reenviando...'
                                        : dailyLimitReached
                                            ? 'Limite diário atingido'
                                            : cooldownRemainingSeconds > 0
                                                ? `Reenviar em ${cooldownRemainingSeconds}s`
                                                : verificationExpired
                                                    ? 'Enviar novo código'
                                                    : 'Reenviar código'}
                                </button>
                                {verificationExpiresAt && (
                                    <p className="text-center text-xs text-slate-500">
                                        {verificationExpired
                                            ? 'Código expirado. Solicite um novo envio.'
                                            : `Código válido até ${verificationExpiresAt.toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}.`}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Link
                                href={isSignupFlow ? '/cadastro/verificar-metodo' : '/perfil/editar'}
                                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-slate-50 hover:text-primary-700"
                            >
                                {isSignupFlow ? 'Trocar método de verificação' : 'Trocar e-mail'}
                            </Link>
                            <Link
                                href={isSignupFlow ? '/auth/cadastro' : '/meus-imoveis'}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {isSignupFlow ? 'Revisar dados do cadastro' : 'Pular por agora'}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
