'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Smartphone } from 'lucide-react'

import { useUser } from '@/contexts/UserContext'
import { resolvePostAuthRoute } from '@/lib/auth/routeResolution'
import {
    requestPhoneOtp,
    resendPhoneOtp,
    verifyPhoneOtp,
} from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/client'
import { formatPhoneInput } from '@/lib/phoneInput'

export default function VerificarTelefonePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { session, loading } = useUser()

    const [phone, setPhone] = useState('')
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/cadastro/verificar-telefone')
        }
    }, [loading, router, session])

    useEffect(() => {
        const phoneFromQuery = searchParams.get('phone')
        if (phoneFromQuery) {
            setPhone(formatPhoneInput(phoneFromQuery))
            return
        }

        const phoneFromSession = session?.user.phone
        if (phoneFromSession) {
            setPhone(formatPhoneInput(phoneFromSession))
        }
    }, [searchParams, session])

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

    const handleSendOtp = async () => {
        const normalizedPhone = phone.replace(/\D/g, '')
        if (normalizedPhone.length < 10) {
            setError('Informe um telefone válido antes de continuar.')
            return
        }

        setSending(true)
        setError(null)
        try {
            const response = sessionToken
                ? await resendPhoneOtp(sessionToken)
                : await requestPhoneOtp(normalizedPhone)
            setSessionToken(response.sessionToken)
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Não foi possível enviar o código por SMS.')
        } finally {
            setSending(false)
        }
    }

    const handleVerify = async () => {
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
            setTimeout(() => {
                if (!session) {
                    router.push('/onboarding')
                    return
                }
                router.push(resolvePostAuthRoute(session, '/onboarding'))
            }, 1500)
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Não foi possível validar o código informado.')
        } finally {
            setVerifying(false)
        }
    }

    if (loading || !session) {
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
                        <p className="text-sm text-slate-600">Redirecionando para continuar seu perfil...</p>
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
                            onClick={handleSendOtp}
                            disabled={sending || verifying}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {sending ? 'Enviando...' : sessionToken ? 'Reenviar código' : 'Enviar código por SMS'}
                        </button>

                        {sessionToken && (
                            <div className="space-y-5">
                                <div className="flex justify-center gap-2" aria-label="Código de telefone">
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
                                href="/onboarding"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar ao onboarding
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
