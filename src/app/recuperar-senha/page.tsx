'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/api/auth'
import type { ApiError } from '@/lib/api/client'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function RecuperarSenhaPage() {
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            await requestPasswordReset(email)
            setSent(true)
        } catch (err) {
            const apiErr = err as ApiError
            if ('status' in apiErr && apiErr.status === 429) {
                setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
            } else {
                setError(apiErr?.message || 'Não foi possível enviar o e-mail de recuperação.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 space-y-6">
                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            E-mail enviado!
                        </h1>
                        <p className="text-sm text-slate-600">
                            Se uma conta existir com o e-mail <strong>{email}</strong>, você receberá
                            instruções para redefinir sua senha.
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 text-center">
                            <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                                <Mail className="w-7 h-7 text-primary-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Recuperar senha
                            </h1>
                            <p className="text-sm text-slate-600">
                                Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
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

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-primary-500/20 transition-colors"
                            >
                                {submitting ? 'Enviando...' : 'Enviar instruções'}
                            </button>
                        </form>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-600"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
