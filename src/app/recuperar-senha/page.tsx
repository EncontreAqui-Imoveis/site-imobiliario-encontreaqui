'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
    checkEmail,
    confirmPasswordReset,
    requestPasswordReset,
    verifyPasswordResetCode,
} from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/client'
import { ArrowLeft, CheckCircle, KeyRound, LockKeyhole, Mail } from 'lucide-react'

type Step = 'request' | 'code' | 'password' | 'success'

function isValidPassword(password: string) {
    return password.trim().length >= 6
}

export default function RecuperarSenhaPage() {
    const [step, setStep] = useState<Step>('request')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [resetSessionToken, setResetSessionToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const nextCode = [...code]
        nextCode[index] = value
        setCode(nextCode)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleRequest = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const status = await checkEmail(email)
            if (status.exists && status.hasFirebaseUid && !status.hasPassword) {
                setError('Esta conta usa apenas Google e não possui senha local.')
                return
            }

            await requestPasswordReset(email)
            setStep('code')
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 429) {
                setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
            } else {
                setError(apiErr?.message || 'Não foi possível enviar o código de recuperação.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleVerifyCode = async () => {
        const fullCode = code.join('')
        if (fullCode.length !== 6) {
            setError('Insira o código completo de 6 dígitos.')
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            const result = await verifyPasswordResetCode(email, fullCode)
            setResetSessionToken(result.reset_session_token)
            setStep('password')
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 410) {
                setError('Código expirado. Solicite um novo.')
            } else if ('status' in apiErr && apiErr.status === 423) {
                setError('Você atingiu o limite de tentativas. Solicite um novo código.')
            } else {
                setError(apiErr?.message || 'Não foi possível validar o código.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleConfirmPassword = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)

        if (!isValidPassword(newPassword)) {
            setError('A nova senha deve ter ao menos 6 caracteres.')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        setSubmitting(true)
        try {
            await confirmPasswordReset(email, resetSessionToken, newPassword)
            setStep('success')
        } catch (err) {
            const apiErr = err as ApiError
            setError(apiErr?.message || 'Não foi possível redefinir a senha.')
        } finally {
            setSubmitting(false)
        }
    }

    const renderHeader = () => (
        <div className="space-y-2 text-center">
            <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                {step === 'request' && <Mail className="w-7 h-7 text-primary-600" />}
                {step === 'code' && <KeyRound className="w-7 h-7 text-primary-600" />}
                {step === 'password' && <LockKeyhole className="w-7 h-7 text-primary-600" />}
                {step === 'success' && <CheckCircle className="w-7 h-7 text-green-500" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
                {step === 'request' && 'Recuperar senha'}
                {step === 'code' && 'Confirmar código'}
                {step === 'password' && 'Definir nova senha'}
                {step === 'success' && 'Senha atualizada'}
            </h1>
            <p className="text-sm text-slate-600">
                {step === 'request' && 'Informe seu e-mail e enviaremos um código de redefinição.'}
                {step === 'code' && `Digite o código enviado para ${email}.`}
                {step === 'password' && 'Agora escolha sua nova senha.'}
                {step === 'success' && 'Sua senha foi redefinida com sucesso.'}
            </p>
        </div>
    )

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                {renderHeader()}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        {error}
                    </p>
                )}

                {step === 'request' && (
                    <form onSubmit={handleRequest} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="voce@exemplo.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {submitting ? 'Enviando...' : 'Enviar código'}
                        </button>
                    </form>
                )}

                {step === 'code' && (
                    <div className="space-y-5">
                        <div className="flex justify-center gap-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {submitting ? 'Validando...' : 'Validar código'}
                        </button>

                        <button
                            type="button"
                            onClick={() => void requestPasswordReset(email)}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Reenviar código
                        </button>
                    </div>
                )}

                {step === 'password' && (
                    <form onSubmit={handleConfirmPassword} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                                Nova senha
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                                Confirmar senha
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                        >
                            {submitting ? 'Salvando...' : 'Salvar nova senha'}
                        </button>
                    </form>
                )}

                {step === 'success' && (
                    <div className="text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o login
                        </Link>
                    </div>
                )}

                {step !== 'success' && (
                    <div className="text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-600"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
