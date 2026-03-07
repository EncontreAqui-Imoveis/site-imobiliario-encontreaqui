'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { sendEmailVerificationCode, verifyEmailCode } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/client'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function VerificacaoPage() {
    const router = useRouter()
    const { session, loading, refresh } = useUser()

    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/auth/login?next=/verificacao')
        }
    }, [loading, session, router])

    const email = session?.user.email || ''

    const handleSendCode = async () => {
        if (!email) return
        setResending(true)
        setError(null)
        try {
            await sendEmailVerificationCode(email)
            setCodeSent(true)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 429) {
                setError('Muitas tentativas. Aguarde e tente novamente.')
            } else {
                setError('Erro ao enviar código. Tente novamente.')
            }
        } finally {
            setResending(false)
        }
    }

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerify = async () => {
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
            await refresh()
            setTimeout(() => {
                router.push('/meus-imoveis')
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
                        <h1 className="text-2xl font-bold text-slate-900">
                            Conta verificada!
                        </h1>
                        <p className="text-sm text-slate-600">
                            Redirecionando...
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
                            <button
                                onClick={handleSendCode}
                                disabled={resending}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {resending ? 'Enviando...' : 'Enviar código de verificação'}
                            </button>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex justify-center gap-2">
                                    {code.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
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
                                    onClick={handleSendCode}
                                    disabled={resending}
                                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                >
                                    {resending ? 'Reenviando...' : 'Reenviar código'}
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 text-center">
                            <Link
                                href="/perfil/editar"
                                className="inline-flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                                Trocar e-mail
                            </Link>
                            <Link
                                href="/meus-imoveis"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Pular por agora
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
